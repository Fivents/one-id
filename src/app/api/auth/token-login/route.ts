import { NextRequest, NextResponse } from 'next/server';

import { makeTotemLoginController } from '@/core/application/controller-factories';
import { loginAccessCodeRequestSchema } from '@/core/communication/requests/auth';
import { AppError } from '@/core/errors';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { resolveActiveTotemEventContextByKey } from '../../totem/_lib/active-totem-context';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = parseWithZod(loginAccessCodeRequestSchema, body);

    const activeContext = await resolveActiveTotemEventContextByKey(data.accessCode);

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
    const result = await controller.handle(data.accessCode, {
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
    });

    // Check if authentication failed
    if (result.statusCode !== 200) {
      return toNextResponse(result);
    }

    // Use result.body directly
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

    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
