import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { getUserAuth, type RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedEvent } from '../../../_lib/access';

export const DELETE = withAuth(
  withRBAC(['CHECKIN_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId, checkInId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const auth = getUserAuth(req);

      const checkIn = await prisma.checkIn.findFirst({
        where: {
          id: checkInId,
          eventParticipant: {
            eventId,
          },
        },
        select: {
          id: true,
          eventParticipantId: true,
          method: true,
        },
      });

      if (!checkIn) {
        return NextResponse.json({ error: 'Check-in not found for this event.' }, { status: 404 });
      }

      await prisma.$transaction([
        prisma.checkIn.delete({
          where: {
            id: checkIn.id,
          },
        }),
        prisma.auditLog.create({
          data: {
            action: 'CHECK_IN_DENIED',
            description: 'Check-in invalidated by event manager.',
            metadata: {
              source: 'APP',
              checkInId: checkIn.id,
              eventParticipantId: checkIn.eventParticipantId,
              method: checkIn.method,
              reason: 'INVALIDATED_FROM_DASHBOARD',
            },
            eventId,
            organizationId: eventOrResponse.organizationId,
            userId: auth.userId,
          },
        }),
      ]);

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to invalidate check-in.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }),
);
