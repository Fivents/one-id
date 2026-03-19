import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedEvent } from '../../../_lib/access';

const HEARTBEAT_WINDOW_MS = 2 * 60 * 1000;

export const GET = withAuth(
  withRBAC(['CHECKIN_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const heartbeatThreshold = new Date(now.getTime() - HEARTBEAT_WINDOW_MS);

    const [liveCount, checkInsPerMinute, lowConfidencePerMinute, lastCheckIn, activeTotems, potentiallyOffline] =
      await Promise.all([
        prisma.checkIn.count({
          where: {
            eventParticipant: { eventId, deletedAt: null },
          },
        }),
        prisma.checkIn.count({
          where: {
            eventParticipant: { eventId, deletedAt: null },
            checkedInAt: { gte: oneMinuteAgo },
          },
        }),
        prisma.checkIn.count({
          where: {
            eventParticipant: { eventId, deletedAt: null },
            checkedInAt: { gte: oneMinuteAgo },
            method: 'FACE_RECOGNITION',
            confidence: { lt: 0.65 },
          },
        }),
        prisma.checkIn.findFirst({
          where: {
            eventParticipant: { eventId, deletedAt: null },
          },
          orderBy: [{ checkedInAt: 'desc' }, { id: 'desc' }],
          include: {
            eventParticipant: {
              select: {
                person: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        }),
        prisma.totemEventSubscription.count({
          where: {
            eventId,
            startsAt: { lte: now },
            endsAt: { gte: now },
            totemOrganizationSubscription: {
              totem: {
                status: 'ACTIVE',
                lastHeartbeat: { gte: heartbeatThreshold },
                deletedAt: null,
              },
            },
          },
        }),
        prisma.totemEventSubscription.findMany({
          where: {
            eventId,
            startsAt: { lte: now },
            endsAt: { gte: now },
            totemOrganizationSubscription: {
              totem: {
                OR: [{ status: { not: 'ACTIVE' } }, { lastHeartbeat: { lt: heartbeatThreshold } }],
                deletedAt: null,
              },
            },
          },
          select: {
            totemOrganizationSubscription: {
              select: {
                totem: {
                  select: {
                    id: true,
                    name: true,
                    lastHeartbeat: true,
                    status: true,
                  },
                },
              },
            },
          },
        }),
      ]);

    const alerts: Array<{ type: 'LOW_CONFIDENCE' | 'PEAK' | 'TOTEM_OFFLINE'; message: string }> = [];

    if (checkInsPerMinute >= 20) {
      alerts.push({
        type: 'PEAK',
        message: `High traffic detected: ${checkInsPerMinute} check-ins in the last minute.`,
      });
    }

    if (lowConfidencePerMinute > 0) {
      alerts.push({
        type: 'LOW_CONFIDENCE',
        message: `${lowConfidencePerMinute} low-confidence face check-ins detected in the last minute.`,
      });
    }

    for (const item of potentiallyOffline) {
      const totem = item.totemOrganizationSubscription.totem;
      alerts.push({
        type: 'TOTEM_OFFLINE',
        message: `${totem.name} may be offline or inactive (status: ${totem.status}).`,
      });
    }

    return NextResponse.json(
      {
        liveCheckIns: liveCount,
        checkInsPerMinute,
        lastCheckIn: lastCheckIn
          ? {
              participantName: lastCheckIn.eventParticipant.person.name,
              method: lastCheckIn.method,
              checkedInAt: lastCheckIn.checkedInAt,
            }
          : null,
        activeTotemsNow: activeTotems,
        alerts,
      },
      { status: 200 },
    );
  }),
);
