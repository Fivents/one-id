import { NextRequest, NextResponse } from 'next/server';

import { makeRegisterManualCheckInController } from '@/core/application/controller-factories';
import { registerCheckInRequestSchema } from '@/core/communication/requests/check-in';
import { AppError } from '@/core/errors';
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
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
