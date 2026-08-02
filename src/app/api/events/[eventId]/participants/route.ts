import { NextRequest, NextResponse } from 'next/server';

import { makeRegisterParticipantController } from '@/core/application/controller-factories';
import { registerParticipantRequestSchema } from '@/core/communication/requests/event-participant';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { resolveTotemAccessCodeLength } from '@/core/utils/checkin-credentials';
import {
  type CodeSourceField,
  normalizeDocumentAsAccessCode,
  resolveDerivedCodeUnique,
} from '@/core/utils/derived-code';
import { parseWithZod } from '@/core/utils/parse-with-zod';
import { Prisma } from '@/generated/prisma/client';

import { getAuthorizedEvent } from '../../_lib/access';

export const GET = withAuth(
  withRBAC(['PARTICIPANT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const search = req.nextUrl.searchParams.get('search')?.trim() ?? '';
    const page = Math.max(Number(req.nextUrl.searchParams.get('page') ?? '1') || 1, 1);
    const pageSizeRaw = Number(req.nextUrl.searchParams.get('pageSize') ?? '20') || 20;
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100);

    const where = {
      eventId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { person: { name: { contains: search, mode: 'insensitive' as const } } },
              { person: { email: { contains: search, mode: 'insensitive' as const } } },
              { company: { contains: search, mode: 'insensitive' as const } },
              { jobTitle: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, participants] = await Promise.all([
      prisma.eventParticipant.count({ where }),
      prisma.eventParticipant.findMany({
        where,
        include: {
          person: {
            select: {
              id: true,
              name: true,
              email: true,
              document: true,
              faces: {
                where: { deletedAt: null, isActive: true },
                select: { id: true, imageUrl: true },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
          checkIns: {
            select: { id: true },
            orderBy: { checkedInAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    const result = participants.map((participant) => ({
      id: participant.id,
      personId: participant.personId,
      name: participant.person.name,
      email: participant.person.email,
      document: participant.person.document,
      company: participant.company,
      jobTitle: participant.jobTitle,
      qrCodeValue: participant.qrCodeValue,
      accessCode: participant.accessCode,
      useDocumentAsAccessCode: participant.useDocumentAsAccessCode,
      eventId: participant.eventId,
      registeredAt: participant.createdAt,
      hasCheckIn: participant.checkIns.length > 0,
      lastCheckInId: participant.checkIns[0]?.id ?? null,
      faceId: participant.person.faces[0]?.id ?? null,
      faceImageUrl: participant.person.faces[0]?.imageUrl ?? null,
    }));

    return NextResponse.json({ items: result, page, pageSize, total, totalPages }, { status: 200 });
  }),
);

export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const event = eventOrResponse;

      const body = await req.json();
      const data = parseWithZod(registerParticipantRequestSchema, { ...body, eventId });
      const credentialLength = await resolveTotemAccessCodeLength(prisma, event.organizationId);
      const requestedUseDocumentAsAccessCode = Boolean(data.useDocumentAsAccessCode);

      // Effective source = this event's own override, falling back to the organization default.
      const peopleSettings = await prisma.organizationPeopleSettings.findUnique({
        where: { organizationId: event.organizationId },
        select: { accessCodeSource: true, qrCodeSource: true },
      });
      const orgAccessCodeSource: CodeSourceField = (peopleSettings?.accessCodeSource as CodeSourceField) ?? 'NONE';
      const orgQrCodeSource: CodeSourceField = (peopleSettings?.qrCodeSource as CodeSourceField) ?? 'NONE';
      const accessCodeSource: CodeSourceField =
        (event.accessCodeSource as CodeSourceField | null) ?? orgAccessCodeSource;
      const qrCodeSource: CodeSourceField = (event.qrCodeSource as CodeSourceField | null) ?? orgQrCodeSource;

      const isPersonCodeTaken = (field: 'accessCode' | 'qrCodeValue', value: string) =>
        prisma.person
          .findFirst({
            where: { organizationId: event.organizationId, deletedAt: null, [field]: value },
            select: { id: true },
          })
          .then((person) => person !== null);

      const isParticipantCodeTaken = (field: 'accessCode' | 'qrCodeValue', value: string) =>
        prisma.eventParticipant
          .findFirst({
            where: { eventId, deletedAt: null, [field]: value },
            select: { id: true },
          })
          .then((participant) => participant !== null);

      let personId = data.personId;
      let personDocument: string | null = null;
      // Existing person's own code/provenance (used to inherit onto the new participant by default).
      let personAccessCode: string | null = null;
      let personAccessCodeProvenance: 'MANUAL' | 'RANDOM' | 'DERIVED' | null = null;
      let personQrCodeValue: string | null = null;
      let personQrCodeProvenance: 'MANUAL' | 'RANDOM' | 'DERIVED' | null = null;

      if (personId) {
        const person = await prisma.person.findUnique({
          where: { id: personId, deletedAt: null },
          select: {
            organizationId: true,
            document: true,
            accessCode: true,
            accessCodeProvenance: true,
            qrCodeValue: true,
            qrCodeProvenance: true,
          },
        });

        if (!person || person.organizationId !== event.organizationId) {
          return NextResponse.json({ error: 'Person not found for this organization.' }, { status: 404 });
        }

        personDocument = person.document;
        personAccessCode = person.accessCode;
        personAccessCodeProvenance = person.accessCodeProvenance;
        personQrCodeValue = person.qrCodeValue;
        personQrCodeProvenance = person.qrCodeProvenance;
      } else {
        const person = await prisma.person.findFirst({
          where: {
            organizationId: event.organizationId,
            email: data.email!,
          },
          select: { id: true, deletedAt: true, document: true },
        });

        // A brand-new Person (or one restored from soft-delete) has no code of its own yet,
        // so its own accessCode/qrCodeValue are derived here too, from the freshly-submitted fields.
        const newPersonAccessCode = await resolveDerivedCodeUnique(
          {
            explicitValue: undefined,
            sourceField: accessCodeSource,
            document: data.document,
            phone: data.phone,
            email: data.email,
            credentialLength,
            uppercase: true,
          },
          (value) => isPersonCodeTaken('accessCode', value),
        );
        const newPersonQrCode = await resolveDerivedCodeUnique(
          {
            explicitValue: undefined,
            sourceField: qrCodeSource,
            document: data.document,
            phone: data.phone,
            email: data.email,
            credentialLength,
            uppercase: false,
          },
          (value) => isPersonCodeTaken('qrCodeValue', value),
        );

        if (person) {
          if (person.deletedAt) {
            const restoredPerson = await prisma.person.update({
              where: { id: person.id },
              data: {
                name: data.name!,
                document: data.document ?? null,
                documentType: data.documentType ?? null,
                phone: data.phone ?? null,
                qrCodeValue: newPersonQrCode.value,
                accessCode: newPersonAccessCode.value,
                accessCodeProvenance: newPersonAccessCode.provenance,
                qrCodeProvenance: newPersonQrCode.provenance,
                deletedAt: null,
              },
              select: { id: true, document: true },
            });

            personId = restoredPerson.id;
            personDocument = restoredPerson.document;
          } else {
            personId = person.id;
            personDocument = person.document;
          }
        } else {
          const createdPerson = await prisma.person.create({
            data: {
              name: data.name!,
              email: data.email!,
              document: data.document ?? null,
              documentType: data.documentType ?? null,
              phone: data.phone ?? null,
              qrCodeValue: newPersonQrCode.value,
              accessCode: newPersonAccessCode.value,
              accessCodeProvenance: newPersonAccessCode.provenance,
              qrCodeProvenance: newPersonQrCode.provenance,
              organizationId: event.organizationId,
            },
            select: { id: true, document: true },
          });

          personId = createdPerson.id;
          personDocument = createdPerson.document;
        }

        personAccessCode = newPersonAccessCode.value;
        personAccessCodeProvenance = newPersonAccessCode.provenance;
        personQrCodeValue = newPersonQrCode.value;
        personQrCodeProvenance = newPersonQrCode.provenance;
      }

      // Priority for the participant's own accessCode: (1) explicit useDocumentAsAccessCode flag
      // (existing mechanism, always wins), (2) explicit accessCode typed in the form, (3) inherit
      // the Person's own code, (4) derive from the freshly-submitted fields (brand-new person only).
      const documentAccessCode = normalizeDocumentAsAccessCode(personDocument);
      let accessCode: string;
      let accessCodeProvenance: 'MANUAL' | 'RANDOM' | 'DERIVED' | undefined;

      if (requestedUseDocumentAsAccessCode && documentAccessCode) {
        accessCode = documentAccessCode;
        accessCodeProvenance = undefined;
      } else if (data.accessCode?.trim()) {
        accessCode = data.accessCode.trim().toUpperCase();
        accessCodeProvenance = 'MANUAL';
      } else if (personAccessCode) {
        // Reuse the Person's own code (already resolved above for both existing and brand-new
        // people) so the participant never ends up with a different value than the Person record.
        accessCode = personAccessCode;
        accessCodeProvenance = personAccessCodeProvenance ?? 'RANDOM';
      } else {
        const resolved = await resolveDerivedCodeUnique(
          {
            explicitValue: undefined,
            sourceField: accessCodeSource,
            document: data.document,
            phone: data.phone,
            email: data.email,
            credentialLength,
            uppercase: true,
          },
          (value) => isParticipantCodeTaken('accessCode', value),
        );
        accessCode = resolved.value;
        accessCodeProvenance = resolved.provenance;
      }

      let qrCodeValue: string;
      let qrCodeProvenance: 'MANUAL' | 'RANDOM' | 'DERIVED';

      if (data.qrCodeValue?.trim()) {
        qrCodeValue = data.qrCodeValue.trim();
        qrCodeProvenance = 'MANUAL';
      } else if (personQrCodeValue) {
        // Reuse the Person's own code (already resolved above for both existing and brand-new
        // people) so the participant never ends up with a different value than the Person record.
        qrCodeValue = personQrCodeValue;
        qrCodeProvenance = personQrCodeProvenance ?? 'RANDOM';
      } else {
        const resolved = await resolveDerivedCodeUnique(
          {
            explicitValue: undefined,
            sourceField: qrCodeSource,
            document: data.document,
            phone: data.phone,
            email: data.email,
            credentialLength,
            uppercase: false,
          },
          (value) => isParticipantCodeTaken('qrCodeValue', value),
        );
        qrCodeValue = resolved.value;
        qrCodeProvenance = resolved.provenance;
      }

      const existing = await prisma.eventParticipant.findFirst({
        where: {
          eventId,
          personId,
        },
        select: { id: true, deletedAt: true },
      });

      if (existing?.deletedAt) {
        const restored = await prisma.eventParticipant.update({
          where: { id: existing.id },
          data: {
            company: data.company ?? null,
            jobTitle: data.jobTitle ?? null,
            qrCodeValue,
            accessCode,
            useDocumentAsAccessCode: requestedUseDocumentAsAccessCode,
            accessCodeProvenance,
            qrCodeProvenance,
            deletedAt: null,
          },
        });

        return NextResponse.json(restored, { status: 200 });
      }

      const controller = makeRegisterParticipantController();
      const result = await controller.handle({
        personId: personId!,
        eventId: data.eventId,
        company: data.company,
        jobTitle: data.jobTitle,
        qrCodeValue,
        accessCode,
        useDocumentAsAccessCode: requestedUseDocumentAsAccessCode,
        accessCodeProvenance,
        qrCodeProvenance,
      });

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'QR code or access code already in use for this event.' }, { status: 409 });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
