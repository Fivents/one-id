import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withTotemAuth } from '@/core/infrastructure/http/middlewares';
import { getTotemAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { resolveActiveTotemEventContextByTotemId } from '../_lib/active-totem-context';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ACTIVE_CONTEXT_TIMEOUT_MS = 10_000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    void promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

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

    let activeContext: Awaited<ReturnType<typeof resolveActiveTotemEventContextByTotemId>>;

    try {
      activeContext = await withTimeout(
        resolveActiveTotemEventContextByTotemId(totemId),
        ACTIVE_CONTEXT_TIMEOUT_MS,
      );
    } catch {
      return NextResponse.json(
        {
          error: 'Unable to resolve active event context for this totem.',
          code: 'TOTEM_SESSION_CONTEXT_TIMEOUT',
        },
        { status: 504 },
      );
    }

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
