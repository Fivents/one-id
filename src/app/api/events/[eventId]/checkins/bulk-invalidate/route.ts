import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedEvent } from '../../../_lib/access';

const bulkInvalidateSchema = z.object({
  checkInIds: z.array(z.string().min(1)).min(1).max(500),
});

export const POST = withAuth(
  withRBAC(['CHECKIN_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const auth = getUserAuth(req);
      const body = await req.json();
      const data = bulkInvalidateSchema.parse(body);

      const found = await prisma.checkIn.findMany({
        where: {
          id: { in: data.checkInIds },
          eventParticipant: { eventId },
        },
        select: { id: true, eventParticipantId: true, method: true },
      });

      if (found.length === 0) {
        return NextResponse.json({ deleted: 0, notFound: data.checkInIds }, { status: 200 });
      }

      const foundIds = new Set(found.map((checkIn) => checkIn.id));
      const notFound = data.checkInIds.filter((id) => !foundIds.has(id));

      // Same semantics as the single DELETE route: CheckIn has no `deletedAt`, so invalidation
      // is a physical delete and the audit log is the only remaining trace.
      await prisma.$transaction([
        prisma.checkIn.deleteMany({ where: { id: { in: [...foundIds] } } }),
        prisma.auditLog.createMany({
          data: found.map((checkIn) => ({
            action: 'CHECK_IN_DENIED' as const,
            description: 'Check-ins invalidated in bulk by event manager.',
            metadata: {
              source: 'APP',
              bulk: true,
              checkInId: checkIn.id,
              eventParticipantId: checkIn.eventParticipantId,
              method: checkIn.method,
              reason: 'INVALIDATED_FROM_DASHBOARD',
            },
            eventId,
            organizationId: eventOrResponse.organizationId,
            userId: auth.userId,
          })),
        }),
      ]);

      return NextResponse.json({ deleted: found.length, notFound }, { status: 200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to invalidate check-ins.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }),
);
