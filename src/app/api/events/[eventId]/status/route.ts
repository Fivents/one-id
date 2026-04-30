import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import {
  makeActivateEventController,
  makeCancelEventController,
  makeCompleteEventController,
  makePublishEventController,
} from '@/core/application/controller-factories';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { getAuthorizedEvent } from '../../_lib/access';

const eventStatusSchema = z.object({
  status: z.enum(['PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELED']),
});

export const PATCH = withAuth(
  withRBAC(['EVENT_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const body = await req.json();
      const data = parseWithZod(eventStatusSchema, body);

      if (data.status === 'PUBLISHED') {
        const controller = makePublishEventController();
        const result = await controller.handle(eventId);
        return toNextResponse(result);
      }

      if (data.status === 'ACTIVE') {
        const controller = makeActivateEventController();
        const result = await controller.handle(eventId);
        return toNextResponse(result);
      }

      if (data.status === 'COMPLETED') {
        const controller = makeCompleteEventController();
        const result = await controller.handle(eventId);
        return toNextResponse(result);
      }

      const controller = makeCancelEventController();
      const result = await controller.handle(eventId);
      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
