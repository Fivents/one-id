import { NextRequest, NextResponse } from 'next/server';

import { makeRegisterManualCheckInController } from '@/core/application/controller-factories';
import { registerCheckInRequestSchema } from '@/core/communication/requests/check-in';
import { withAuth, withTotemAuth } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const POST = withAuth(
  withTotemAuth(async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(registerCheckInRequestSchema, body);

      const controller = makeRegisterManualCheckInController();
      const result = await controller.handle({
        eventParticipantId: data.eventParticipantId,
        totemEventSubscriptionId: data.totemEventSubscriptionId,
      });

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodValidationError') {
        return NextResponse.json({ error: 'Invalid request data.' }, { status: 400 });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
