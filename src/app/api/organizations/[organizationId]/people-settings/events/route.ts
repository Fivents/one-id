import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { assertOrganizationAccess } from '../../../_lib/access';

export const GET = withAuth(
  withRBAC(['EVENT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { organizationId } = await context.params;

    const accessError = await assertOrganizationAccess(req, organizationId);
    if (accessError) {
      return accessError;
    }

    const events = await prisma.event.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        status: true,
        startsAt: true,
        endsAt: true,
        autoLinkNewPeople: true,
      },
      orderBy: { startsAt: 'desc' },
    });

    return NextResponse.json(events, { status: 200 });
  }),
);
