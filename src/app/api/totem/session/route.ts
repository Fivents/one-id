import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withTotemAuth } from '@/core/infrastructure/http/middlewares';
import { getTotemAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { resolveActiveTotemEventContextByTotemId } from '../_lib/active-totem-context';

export const GET = withAuth(
  withTotemAuth(async (req: NextRequest) => {
    const auth = getTotemAuth(req);
    const totemId = auth.totemId;

    const session = await prisma.totemSession.findFirst({
      where: {
        totemId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      return NextResponse.json({ error: 'Totem session expired.' }, { status: 401 });
    }

    const activeContext = await resolveActiveTotemEventContextByTotemId(totemId);

    if (!activeContext) {
      return NextResponse.json(
        {
          error: 'No active event assigned to this totem.',
          code: 'TOTEM_NO_ACTIVE_EVENT',
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        sessionId: session.id,
        expiresAt: session.expiresAt,
        totem: activeContext.totem,
        activeEvent: activeContext.event,
        totemEventSubscriptionId: activeContext.totemEventSubscriptionId,
        aiConfig: activeContext.aiConfig,
      },
      { status: 200 },
    );
  }),
);
