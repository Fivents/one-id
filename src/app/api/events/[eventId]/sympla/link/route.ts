import { NextRequest, NextResponse } from 'next/server';

import {
  makeLinkEventToSymplaController,
  makeUnlinkEventFromSymplaController,
} from '@/core/application/controller-factories';
import { linkEventToSymplaRequestSchema } from '@/core/communication/requests/sympla';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { getAuthorizedEvent } from '../../../_lib/access';

export const GET = withAuth(
  withRBAC(['EVENT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const link = await prisma.symplaEventLink.findUnique({ where: { eventId } });

    // "Not linked" is an ordinary state for an event, not a 404 — the settings tab needs a
    // body either way to decide what to render.
    return NextResponse.json(link ? { linked: true, ...link } : { linked: false }, { status: 200 });
  }),
);

export const POST = withAuth(
  withRBAC(['EVENT_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const body = await req.json();
      const data = parseWithZod(linkEventToSymplaRequestSchema, body);
      const auth = getUserAuth(req);

      const controller = makeLinkEventToSymplaController();
      const result = await controller.handle(eventId, eventOrResponse.organizationId, data, {
        userId: auth.userId,
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

export const DELETE = withAuth(
  withRBAC(['EVENT_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const auth = getUserAuth(req);

      const controller = makeUnlinkEventFromSymplaController();
      const result = await controller.handle(eventId, eventOrResponse.organizationId, { userId: auth.userId });

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
