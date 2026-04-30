import { NextRequest, NextResponse } from 'next/server';

import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

function resolveLifecycleStatus(
  now: Date,
  startsAt: Date,
  endsAt: Date,
  revokedAt?: Date | null,
): 'ACTIVE' | 'EXPIRED' | 'SCHEDULED' | 'REVOKED' {
  if (revokedAt) return 'REVOKED';
  if (startsAt > now) return 'SCHEDULED';
  if (endsAt < now) return 'EXPIRED';
  return 'ACTIVE';
}

export const GET = withAuth(
  withSuperAdmin(async (_req: NextRequest, context: RouteContext) => {
    const { totemId } = await context.params;
    const now = new Date();

    const subscriptions = await prisma.totemOrganizationSubscription.findMany({
      where: {
        totemId,
      },
      select: {
        id: true,
        organizationId: true,
        startsAt: true,
        endsAt: true,
        revokedAt: true,
        revokedReason: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        eventSubscriptions: {
          select: {
            id: true,
            eventId: true,
            locationName: true,
            startsAt: true,
            endsAt: true,
            revokedAt: true,
            revokedReason: true,
            event: {
              select: {
                id: true,
                name: true,
                startsAt: true,
                endsAt: true,
                status: true,
              },
            },
          },
          orderBy: {
            startsAt: 'desc',
          },
        },
      },
      orderBy: {
        startsAt: 'desc',
      },
    });

    return NextResponse.json(
      subscriptions.map((subscription) => ({
        id: subscription.id,
        organizationId: subscription.organizationId,
        organizationName: subscription.organization.name,
        startsAt: subscription.startsAt,
        endsAt: subscription.endsAt,
        revokedAt: subscription.revokedAt,
        revokedReason: subscription.revokedReason,
        status: resolveLifecycleStatus(now, subscription.startsAt, subscription.endsAt, subscription.revokedAt),
        events: subscription.eventSubscriptions.map((eventSubscription) => ({
          id: eventSubscription.id,
          eventId: eventSubscription.eventId,
          eventName: eventSubscription.event.name,
          locationName: eventSubscription.locationName,
          startsAt: eventSubscription.startsAt,
          endsAt: eventSubscription.endsAt,
          revokedAt: eventSubscription.revokedAt,
          revokedReason: eventSubscription.revokedReason,
          status: resolveLifecycleStatus(
            now,
            eventSubscription.startsAt,
            eventSubscription.endsAt,
            eventSubscription.revokedAt,
          ),
          eventStatus: eventSubscription.event.status,
        })),
      })),
      { status: 200 },
    );
  }),
);
