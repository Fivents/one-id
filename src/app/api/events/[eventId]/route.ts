import { NextRequest, NextResponse } from 'next/server';

import {
  makeDeleteEventController,
  makeGetEventController,
  makeUpdateEventController,
} from '@/core/application/controller-factories';
import { updateEventRequestSchema } from '@/core/communication/requests/event';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { getAuthorizedEvent } from '../_lib/access';

export const GET = withAuth(
  withRBAC(['EVENT_VIEW'], async (_req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(_req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const controller = makeGetEventController();
    const result = await controller.handle(eventId);

    return toNextResponse(result);
  }),
);

export const PATCH = withAuth(
  withRBAC(['EVENT_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const body = await req.json();
      const data = parseWithZod(updateEventRequestSchema, body);

      const hasCheckinToggleUpdate =
        data.faceEnabled !== undefined || data.qrEnabled !== undefined || data.codeEnabled !== undefined;

      if (hasCheckinToggleUpdate) {
        const finalFaceEnabled = data.faceEnabled ?? eventOrResponse.faceEnabled;
        const finalQrEnabled = data.qrEnabled ?? eventOrResponse.qrEnabled;
        const finalCodeEnabled = data.codeEnabled ?? eventOrResponse.codeEnabled;

        if (!finalFaceEnabled && !finalQrEnabled && !finalCodeEnabled) {
          return NextResponse.json({ error: 'At least one check-in method must be enabled.' }, { status: 400 });
        }
      }

      const controller = makeUpdateEventController();
      const result = await controller.handle(eventId, data);

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
  withRBAC(['EVENT_DELETE'], async (_req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(_req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const controller = makeDeleteEventController();
    const result = await controller.handle(eventId);

    return toNextResponse(result);
  }),
);
