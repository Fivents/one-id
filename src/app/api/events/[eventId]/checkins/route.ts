import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedEvent } from '../../_lib/access';

export const GET = withAuth(
  withRBAC(['CHECKIN_VIEW'], async (_req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(_req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const checkIns = await prisma.checkIn.findMany({
      where: { eventParticipant: { eventId } },
      include: {
        eventParticipant: {
          include: {
            person: { select: { name: true, email: true } },
          },
        },
        totemEventSubscription: { select: { locationName: true } },
      },
      orderBy: { checkedInAt: 'desc' },
    });

    const result = checkIns.map((checkIn) => ({
      id: checkIn.id,
      method: checkIn.method,
      confidence: checkIn.confidence,
      checkedInAt: checkIn.checkedInAt,
      eventParticipantId: checkIn.eventParticipantId,
      participantName: checkIn.eventParticipant.person.name,
      participantEmail: checkIn.eventParticipant.person.email,
      totemEventSubscriptionId: checkIn.totemEventSubscriptionId,
      totemLocation: checkIn.totemEventSubscription.locationName,
    }));

    return NextResponse.json(result, { status: 200 });
  }),
);
