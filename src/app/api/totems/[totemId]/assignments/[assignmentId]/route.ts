import { NextRequest, NextResponse } from 'next/server';

import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

export const DELETE = withAuth(
  withSuperAdmin(async (_req: NextRequest, context: RouteContext) => {
    const { totemId, assignmentId } = await context.params;

    const assignment = await prisma.totemOrganizationSubscription.findFirst({
      where: {
        id: assignmentId,
        totemId,
      },
      select: {
        id: true,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });
    }

    await prisma.totemOrganizationSubscription.delete({
      where: {
        id: assignment.id,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  }),
);
