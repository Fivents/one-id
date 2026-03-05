import { NextRequest, NextResponse } from 'next/server';

import {
  makeListParticipantsController,
  makeRegisterParticipantController,
} from '@/core/application/controller-factories';
import { registerParticipantRequestSchema } from '@/core/communication/requests/event-participant';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withRBAC(['PARTICIPANT_VIEW'], async (_req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const controller = makeListParticipantsController();
    const result = await controller.handle(eventId);

    return toNextResponse(result);
  }),
);

export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;
      const body = await req.json();
      const data = parseWithZod(registerParticipantRequestSchema, { ...body, eventId });

      const controller = makeRegisterParticipantController();
      const result = await controller.handle(data);

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
