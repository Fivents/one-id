import { NextRequest, NextResponse } from 'next/server';

import { makeRegisterParticipantController } from '@/core/application/controller-factories';
import { registerParticipantRequestSchema } from '@/core/communication/requests/event-participant';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

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
          person: { select: { id: true, name: true, email: true } },
          checkIns: { select: { id: true } },
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
      company: participant.company,
      jobTitle: participant.jobTitle,
      eventId: participant.eventId,
      registeredAt: participant.createdAt,
      hasCheckIn: participant.checkIns.length > 0,
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

      let personId = data.personId;

      if (personId) {
        const person = await prisma.person.findUnique({
          where: { id: personId, deletedAt: null },
          select: { organizationId: true },
        });

        if (!person || person.organizationId !== event.organizationId) {
          return NextResponse.json({ error: 'Person not found for this organization.' }, { status: 404 });
        }
      } else {
        const person = await prisma.person.findFirst({
          where: {
            organizationId: event.organizationId,
            email: data.email!,
          },
          select: { id: true, deletedAt: true },
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
                deletedAt: null,
              },
              select: { id: true },
            });

            personId = restoredPerson.id;
          } else {
            personId = person.id;
          }
        } else {
          const createdPerson = await prisma.person.create({
            data: {
              name: data.name!,
              email: data.email!,
              document: data.document ?? null,
              documentType: data.documentType ?? null,
              phone: data.phone ?? null,
              organizationId: event.organizationId,
            },
            select: { id: true },
          });

          personId = createdPerson.id;
        }
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
      });

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
