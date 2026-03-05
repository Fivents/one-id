import { NextRequest, NextResponse } from 'next/server';

import {
  makeGetParticipantController,
  makeRemoveParticipantController,
  makeUpdateParticipantController,
} from '@/core/application/controller-factories';
import { updateParticipantRequestSchema } from '@/core/communication/requests/event-participant';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withRBAC(['PARTICIPANT_VIEW'], async (_req: NextRequest, context: RouteContext) => {
    const { participantId } = await context.params;

    const controller = makeGetParticipantController();
    const result = await controller.handle(participantId);

    return toNextResponse(result);
  }),
);

export const PATCH = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { participantId } = await context.params;
      const body = await req.json();
      const data = parseWithZod(updateParticipantRequestSchema, body);

      const controller = makeUpdateParticipantController();
      const result = await controller.handle(participantId, data);

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);

export const DELETE = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (_req: NextRequest, context: RouteContext) => {
    const { participantId } = await context.params;

    const controller = makeRemoveParticipantController();
    const result = await controller.handle(participantId);

    return toNextResponse(result);
  }),
);
