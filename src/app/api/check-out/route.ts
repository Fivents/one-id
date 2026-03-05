import { NextRequest, NextResponse } from 'next/server';

import { makeRegisterManualCheckInController } from '@/core/application/controller-factories';
import { withAuth, withTotemAuth } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';

export const POST = withAuth(
  withTotemAuth(async (req: NextRequest) => {
    try {
      const body = await req.json();

      const controller = makeRegisterManualCheckInController();
      const result = await controller.handle({
        eventParticipantId: body.eventParticipantId,
        totemEventSubscriptionId: body.totemEventSubscriptionId,
      });

      return toNextResponse(result);
    } catch {
      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
