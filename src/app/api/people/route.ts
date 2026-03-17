import { NextRequest, NextResponse } from 'next/server';

import { makeCreatePersonController } from '@/core/application/controller-factories';
import { createPersonRequestSchema } from '@/core/communication/requests/person';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { assertOrganizationAccess } from './_lib/access';

export const GET = withAuth(
  withRBAC(['PARTICIPANT_VIEW'], async (req: NextRequest) => {
    const auth = getUserAuth(req);

    const organizationId = req.nextUrl.searchParams.get('organizationId') ?? auth.organizationId ?? '';
    const search = req.nextUrl.searchParams.get('search')?.trim() ?? '';
    const eventId = req.nextUrl.searchParams.get('eventId')?.trim() ?? '';
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
            deletedAt: null,
          },
        });

        return NextResponse.json(restored, { status: 200 });
      }

      const controller = makeCreatePersonController();
      const result = await controller.handle(data);

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
