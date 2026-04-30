import { NextRequest, NextResponse } from 'next/server';

import { makeRegisterParticipantController } from '@/core/application/controller-factories';
import { registerParticipantRequestSchema } from '@/core/communication/requests/event-participant';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { generateCheckInCredential, resolveTotemAccessCodeLength } from '@/core/utils/checkin-credentials';
import { parseWithZod } from '@/core/utils/parse-with-zod';
import { Prisma } from '@/generated/prisma/client';

import { getAuthorizedEvent } from '../../_lib/access';

function normalizeDocumentAsAccessCode(document: string | null | undefined): string | null {
  const normalized = document?.trim();
  return normalized ? normalized.toUpperCase() : null;
}

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
      const qrCodeValue = data.qrCodeValue?.trim() || generateCheckInCredential(credentialLength);
      const requestedUseDocumentAsAccessCode = Boolean(data.useDocumentAsAccessCode);

      let personId = data.personId;
      let personDocument: string | null = null;

      if (personId) {
        const person = await prisma.person.findUnique({
          where: { id: personId, deletedAt: null },
          select: { organizationId: true, document: true },
        });

        if (!person || person.organizationId !== event.organizationId) {
          return NextResponse.json({ error: 'Person not found for this organization.' }, { status: 404 });
        }

        personDocument = person.document;
      } else {
        const person = await prisma.person.findFirst({
          where: {
            organizationId: event.organizationId,
            email: data.email!,
          },
          select: { id: true, deletedAt: true, document: true },
        });

        if (person) {
          if (person.deletedAt) {
            const restoredPerson = await prisma.person.update({
              where: { id: person.id },
              data: {
                name: data.name!,
                document: data.document ?? null,
                documentType: data.documentType ?? null,
                phone: data.phone ?? null,
                qrCodeValue,
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
              qrCodeValue,
              organizationId: event.organizationId,
            },
            select: { id: true, document: true },
          });

          personId = createdPerson.id;
          personDocument = createdPerson.document;
        }
      }

      const documentAccessCode = normalizeDocumentAsAccessCode(personDocument);
      const fallbackAccessCode = data.accessCode?.trim().toUpperCase() || generateCheckInCredential(credentialLength);
      const accessCode = requestedUseDocumentAsAccessCode && documentAccessCode ? documentAccessCode : fallbackAccessCode;

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
