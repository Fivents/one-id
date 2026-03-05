import { NextRequest, NextResponse } from 'next/server';

import { makeCreateEventController, makeListEventsController } from '@/core/application/controller-factories';
import { createEventRequestSchema } from '@/core/communication/requests/event';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withRBAC(['EVENT_VIEW'], async (req: NextRequest) => {
    const auth = getUserAuth(req);

    const organizationId = req.nextUrl.searchParams.get('organizationId') ?? auth.organizationId ?? '';

    const controller = makeListEventsController();
    const result = await controller.handle(organizationId);

    return toNextResponse(result);
  }),
);

export const POST = withAuth(
  withRBAC(['EVENT_CREATE'], async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(createEventRequestSchema, body);

      const controller = makeCreateEventController();
      const result = await controller.handle(data);

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodValidationError') {
        return NextResponse.json({ error: 'Invalid request data.' }, { status: 400 });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
