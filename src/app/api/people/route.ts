import { NextRequest, NextResponse } from 'next/server';

import { makeCreatePersonController } from '@/core/application/controller-factories';
import { createPersonRequestSchema } from '@/core/communication/requests/person';
import type { CodeProvenance } from '@/core/domain/entities';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { resolveTotemAccessCodeLength } from '@/core/utils/checkin-credentials';
import { type CodeSourceField, resolveDerivedCodeUnique } from '@/core/utils/derived-code';
import { parseWithZod } from '@/core/utils/parse-with-zod';
import { Prisma } from '@/generated/prisma/client';

import { assertOrganizationAccess } from './_lib/access';

async function linkPersonToAutoLinkEvents(
  organizationId: string,
  person: {
    id: string;
    accessCode: string;
    accessCodeProvenance: CodeProvenance;
    qrCodeValue: string;
    qrCodeProvenance: CodeProvenance;
  },
): Promise<void> {
  const autoLinkEvents = await prisma.event.findMany({
    where: { organizationId, deletedAt: null, autoLinkNewPeople: true },
    select: { id: true },
  });

  if (autoLinkEvents.length === 0) return;

  await Promise.all(
    autoLinkEvents.map((event) =>
      prisma.eventParticipant.create({
        data: {
          personId: person.id,
          eventId: event.id,
          qrCodeValue: person.qrCodeValue,
          accessCode: person.accessCode,
          accessCodeProvenance: person.accessCodeProvenance,
          qrCodeProvenance: person.qrCodeProvenance,
        },
      }),
    ),
  );
}

export const GET = withAuth(
  withRBAC(['PARTICIPANT_VIEW'], async (req: NextRequest) => {
    const auth = getUserAuth(req);

    const organizationId = req.nextUrl.searchParams.get('organizationId') ?? auth.organizationId ?? '';
    const search = req.nextUrl.searchParams.get('search')?.trim() ?? '';
    const eventId = req.nextUrl.searchParams.get('eventId')?.trim() ?? '';
    const excludeEventId = req.nextUrl.searchParams.get('excludeEventId')?.trim() ?? '';
    const includeDeleted = req.nextUrl.searchParams.get('deleted') === 'true';
    const page = Math.max(Number(req.nextUrl.searchParams.get('page') ?? '1') || 1, 1);
    const pageSizeRaw = Number(req.nextUrl.searchParams.get('pageSize') ?? '20') || 20;
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100);

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization is required.' }, { status: 400 });
    }

    const accessError = await assertOrganizationAccess(req, organizationId);
    if (accessError) {
      return accessError;
    }

    const where = {
      organizationId,
      deletedAt: includeDeleted ? { not: null as Date | null } : null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { document: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(eventId
        ? {
            eventParticipants: {
              some: {
                eventId,
                deletedAt: null,
              },
            },
          }
        : {}),
      ...(excludeEventId
        ? {
            NOT: {
              eventParticipants: {
                some: {
                  eventId: excludeEventId,
                  deletedAt: null,
                },
              },
            },
          }
        : {}),
    };

    const [total, people] = await Promise.all([
      prisma.person.count({ where }),
      prisma.person.findMany({
        where,
        include: {
          faces: {
            where: { deletedAt: null, isActive: true },
            select: { id: true, imageUrl: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              eventParticipants: {
                where: { deletedAt: null },
              },
              faces: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    return NextResponse.json(
      {
        items: people.map((person) => ({
          id: person.id,
          name: person.name,
          email: person.email,
          document: person.document,
          documentType: person.documentType,
          phone: person.phone,
          qrCodeValue: person.qrCodeValue,
          accessCode: person.accessCode,
          accessCodeProvenance: person.accessCodeProvenance,
          qrCodeProvenance: person.qrCodeProvenance,
          organizationId: person.organizationId,
          createdAt: person.createdAt,
          updatedAt: person.updatedAt,
          deletedAt: person.deletedAt,
          eventsCount: person._count.eventParticipants,
          facesCount: person._count.faces,
          faceId: person.faces[0]?.id ?? null,
          faceImageUrl: person.faces[0]?.imageUrl ?? null,
        })),
        page,
        pageSize,
        total,
        totalPages,
      },
      { status: 200 },
    );
  }),
);

export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(createPersonRequestSchema, body);

      const accessError = await assertOrganizationAccess(req, data.organizationId);
      if (accessError) {
        return accessError;
      }

      const credentialLength = await resolveTotemAccessCodeLength(prisma, data.organizationId);
      const peopleSettings = await prisma.organizationPeopleSettings.findUnique({
        where: { organizationId: data.organizationId },
        select: { accessCodeSource: true, qrCodeSource: true },
      });
      const accessCodeSource: CodeSourceField = (peopleSettings?.accessCodeSource as CodeSourceField) ?? 'NONE';
      const qrCodeSource: CodeSourceField = (peopleSettings?.qrCodeSource as CodeSourceField) ?? 'NONE';

      const isCodeTaken = (field: 'accessCode' | 'qrCodeValue', value: string) =>
        prisma.person
          .findFirst({
            where: { organizationId: data.organizationId, deletedAt: null, [field]: value },
            select: { id: true },
          })
          .then((person) => person !== null);

      const accessCodeResolved = await resolveDerivedCodeUnique(
        {
          explicitValue: data.accessCode,
          sourceField: accessCodeSource,
          document: data.document,
          phone: data.phone,
          email: data.email,
          credentialLength,
          uppercase: true,
        },
        (value) => isCodeTaken('accessCode', value),
      );
      const qrCodeResolved = await resolveDerivedCodeUnique(
        {
          explicitValue: data.qrCodeValue,
          sourceField: qrCodeSource,
          document: data.document,
          phone: data.phone,
          email: data.email,
          credentialLength,
          uppercase: false,
        },
        (value) => isCodeTaken('qrCodeValue', value),
      );

      const existing = await prisma.person.findFirst({
        where: {
          organizationId: data.organizationId,
          email: data.email,
        },
      });

      if (existing?.deletedAt) {
        const restored = await prisma.person.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            document: data.document ?? null,
            documentType: data.documentType ?? null,
            phone: data.phone ?? null,
            qrCodeValue: qrCodeResolved.value,
            accessCode: accessCodeResolved.value,
            accessCodeProvenance: accessCodeResolved.provenance,
            qrCodeProvenance: qrCodeResolved.provenance,
            deletedAt: null,
          },
        });

        await linkPersonToAutoLinkEvents(data.organizationId, {
          id: restored.id,
          accessCode: restored.accessCode ?? accessCodeResolved.value,
          accessCodeProvenance: accessCodeResolved.provenance,
          qrCodeValue: restored.qrCodeValue ?? qrCodeResolved.value,
          qrCodeProvenance: qrCodeResolved.provenance,
        });

        return NextResponse.json(restored, { status: 200 });
      }

      const controller = makeCreatePersonController();
      const result = await controller.handle({
        ...data,
        qrCodeValue: qrCodeResolved.value,
        accessCode: accessCodeResolved.value,
        accessCodeProvenance: accessCodeResolved.provenance,
        qrCodeProvenance: qrCodeResolved.provenance,
      });

      if (result.statusCode === 201 && result.body && typeof result.body === 'object' && 'id' in result.body) {
        const createdPerson = result.body as { id: string };
        await linkPersonToAutoLinkEvents(data.organizationId, {
          id: createdPerson.id,
          accessCode: accessCodeResolved.value,
          accessCodeProvenance: accessCodeResolved.provenance,
          qrCodeValue: qrCodeResolved.value,
          qrCodeProvenance: qrCodeResolved.provenance,
        });
      }

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json(
          { error: 'QR code or access code already in use for this organization.' },
          { status: 409 },
        );
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
