import { NextRequest, NextResponse } from 'next/server';

import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

export const POST = withAuth(
  withSuperAdmin(async (_req: NextRequest, context: RouteContext) => {
    const { totemId } = await context.params;

    const now = new Date();

    const activeOrgSubscriptions = await prisma.totemOrganizationSubscription.findMany({
      where: {
        totemId,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      select: {
        id: true,
      },
    });

    if (activeOrgSubscriptions.length === 0) {
      return NextResponse.json({ success: true, endedOrganizationAssignments: 0, endedEventAssignments: 0 });
    }

    const activeOrgSubscriptionIds = activeOrgSubscriptions.map((subscription) => subscription.id);

    const [updatedEventSubscriptions, updatedOrgSubscriptions] = await prisma.$transaction([
      prisma.totemEventSubscription.updateMany({
        where: {
          totemOrganizationSubscriptionId: { in: activeOrgSubscriptionIds },
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
        data: {
          endsAt: now,
          revokedAt: now,
          revokedReason: 'MANUAL_UNASSIGN',
        },
      }),
      prisma.totemOrganizationSubscription.updateMany({
        where: {
          id: { in: activeOrgSubscriptionIds },
        },
        data: {
          endsAt: now,
          revokedAt: now,
          revokedReason: 'MANUAL_UNASSIGN',
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        endedOrganizationAssignments: updatedOrgSubscriptions.count,
        endedEventAssignments: updatedEventSubscriptions.count,
      },
      { status: 200 },
    );
  }),
);
