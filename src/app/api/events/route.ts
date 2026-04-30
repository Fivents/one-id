import { NextRequest, NextResponse } from 'next/server';

import { makeCreateEventController, makeListEventsController } from '@/core/application/controller-factories';
import { createEventRequestSchema } from '@/core/communication/requests/event';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { assertOrganizationAccess } from './_lib/access';

export const GET = withAuth(
  withRBAC(['EVENT_VIEW'], async (req: NextRequest) => {
    const auth = getUserAuth(req);

    const organizationId = req.nextUrl.searchParams.get('organizationId') ?? auth.organizationId ?? '';

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization is required.' }, { status: 400 });
    }

    const accessError = await assertOrganizationAccess(req, organizationId);
    if (accessError) {
      return accessError;
    }

    const controller = makeListEventsController();
    const result = await controller.handle(organizationId);

    if (result.statusCode !== 200) {
      return toNextResponse(result);
    }

    if (!Array.isArray(result.body)) {
      return toNextResponse(result);
    }

    const events = result.body;
    const eventIds = events.map((event) => event.id).filter((id): id is string => typeof id === 'string');

    if (eventIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const participantsCounts = await prisma.eventParticipant.groupBy({
      by: ['eventId'],
      where: { eventId: { in: eventIds }, deletedAt: null },
      _count: { _all: true },
    });

    const totemsCounts = await prisma.totemEventSubscription.groupBy({
      by: ['eventId'],
      where: { eventId: { in: eventIds } },
      _count: { _all: true },
    });

    const checkIns = await prisma.checkIn.findMany({
      where: { eventParticipant: { eventId: { in: eventIds } } },
      select: { eventParticipant: { select: { eventId: true } } },
    });

    const participantsMap = new Map(participantsCounts.map((row) => [row.eventId, row._count._all]));
    const totemsMap = new Map(totemsCounts.map((row) => [row.eventId, row._count._all]));
    const checkInsMap = new Map<string, number>();

    checkIns.forEach((checkIn) => {
      const eventId = checkIn.eventParticipant.eventId;
      checkInsMap.set(eventId, (checkInsMap.get(eventId) ?? 0) + 1);
    });

    const enriched = events.map((event) => {
      const eventId = typeof event.id === 'string' ? event.id : '';

      return {
        ...event,
        participantsCount: participantsMap.get(eventId) ?? 0,
        checkInsCount: checkInsMap.get(eventId) ?? 0,
        totemsCount: totemsMap.get(eventId) ?? 0,
      };
    });

    return NextResponse.json(enriched, { status: 200 });
  }),
);

export const POST = withAuth(
  withRBAC(['EVENT_CREATE'], async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(createEventRequestSchema, body);

      const accessError = await assertOrganizationAccess(req, data.organizationId);
      if (accessError) {
        return accessError;
      }

      const controller = makeCreateEventController();
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
