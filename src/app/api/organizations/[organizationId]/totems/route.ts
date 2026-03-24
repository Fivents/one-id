import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { assertOrganizationAccess } from '../../_lib/access';

export const GET = withAuth(
  withRBAC(['TOTEM_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { organizationId } = await context.params;

    const accessError = await assertOrganizationAccess(req, organizationId);
    if (accessError) {
      return accessError;
    }

    const now = new Date();

    const activeOrgSubscriptions = await prisma.totemOrganizationSubscription.findMany({
      where: {
        organizationId,
        startsAt: { lte: now },
        endsAt: { gte: now },
        totem: {
          deletedAt: null,
        },
      },
      select: {
        id: true,
        totemId: true,
        startsAt: true,
        endsAt: true,
        totem: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        eventSubscriptions: {
          where: {
            startsAt: { lte: now },
            endsAt: { gte: now },
          },
          select: {
            id: true,
            eventId: true,
            locationName: true,
            startsAt: true,
            endsAt: true,
            event: {
              select: {
                id: true,
                name: true,
                organizationId: true,
              },
            },
          },
          orderBy: {
            startsAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        startsAt: 'desc',
      },
    });

    return NextResponse.json(
      activeOrgSubscriptions.map((subscription) => ({
        totemOrganizationSubscriptionId: subscription.id,
        totemId: subscription.totemId,
        totemName: subscription.totem.name,
        totemStatus: subscription.totem.status,
        startsAt: subscription.startsAt,
        endsAt: subscription.endsAt,
        activeEvent: subscription.eventSubscriptions[0]
          ? {
              id: subscription.eventSubscriptions[0].id,
              eventId: subscription.eventSubscriptions[0].eventId,
              eventName: subscription.eventSubscriptions[0].event.name,
              locationName: subscription.eventSubscriptions[0].locationName,
              startsAt: subscription.eventSubscriptions[0].startsAt,
              endsAt: subscription.eventSubscriptions[0].endsAt,
            }
          : null,
      })),
      { status: 200 },
    );
  }),
);
