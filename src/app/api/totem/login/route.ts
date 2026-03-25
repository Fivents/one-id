import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { makeTotemLoginController } from '@/core/application/controller-factories';
import { AppError } from '@/core/errors';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';

import { resolveActiveTotemEventContextByKey } from '../_lib/active-totem-context';

const totemLoginSchema = z.object({
  key: z.string().trim().min(1, 'Totem key is required.'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = totemLoginSchema.parse(body);

    const activeContext = await resolveActiveTotemEventContextByKey(data.key);

    if (!activeContext) {
      return NextResponse.json(
        {
          error: 'No active event assigned to this totem.',
          code: 'TOTEM_NO_ACTIVE_EVENT',
        },
        { status: 403 },
      );
    }

    const controller = makeTotemLoginController();
    const result = await controller.handle(data.key, {
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
    });

    // Check if authentication failed
    if (result.statusCode !== 200) {
      return toNextResponse(result);
    }

    // Use result.body directly instead of parsing NextResponse (body already consumed)
    const payload = result.body as Record<string, unknown>;

    return NextResponse.json(
      {
        ...payload,
        activeEvent: {
          id: activeContext.event.id,
          name: activeContext.event.name,
          startsAt: activeContext.event.startsAt,
          endsAt: activeContext.event.endsAt,
        },
        totemEventSubscriptionId: activeContext.totemEventSubscriptionId,
        aiConfig: activeContext.aiConfig,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatus });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
    }

    // Log the error for debugging
    console.error('[totem-login] Unhandled error:', error);

    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
