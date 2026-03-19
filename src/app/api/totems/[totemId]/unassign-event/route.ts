import { NextRequest, NextResponse } from 'next/server';

import { assertOrganizationAccess } from '@/app/api/organizations/_lib/access';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

export const POST = withAuth(
  withRBAC(['TOTEM_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    const auth = getUserAuth(req);
    const { totemId } = await context.params;

    if (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ORG_OWNER' && auth.role !== 'EVENT_MANAGER') {
      return NextResponse.json({ error: 'Forbidden. Insufficient role for totem-event assignment.' }, { status: 403 });
    }

    const now = new Date();

    const activeOrgSubscription = await prisma.totemOrganizationSubscription.findFirst({
      where: {
        totemId,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      select: {
        organizationId: true,
      },
    });

    if (!activeOrgSubscription) {
      return NextResponse.json({ success: true, endedEventAssignments: 0 }, { status: 200 });
    }

    const accessError = await assertOrganizationAccess(req, activeOrgSubscription.organizationId);
    if (accessError) {
      return accessError;
    }

    const updated = await prisma.totemEventSubscription.updateMany({
      where: {
        totemOrganizationSubscription: {
          totemId,
        },
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      data: {
        endsAt: now,
        revokedAt: now,
        revokedReason: 'MANUAL_UNASSIGN',
      },
    });

    return NextResponse.json({ success: true, endedEventAssignments: updated.count }, { status: 200 });
  }),
);
