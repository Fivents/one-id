import { NextRequest, NextResponse } from 'next/server';

import {
  makeSetTotemLocationController,
  makeUnlinkTotemFromEventController,
} from '@/core/application/controller-factories';
import { setTotemLocationRequestSchema } from '@/core/communication/requests/totem-event-subscription';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { getAuthorizedEvent } from '../../../_lib/access';

export const PATCH = withAuth(
  withRBAC(['TOTEM_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId, subscriptionId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const subscription = await prisma.totemEventSubscription.findUnique({
        where: { id: subscriptionId },
        select: { eventId: true },
      });

      if (!subscription || subscription.eventId !== eventId) {
        return NextResponse.json({ error: 'Subscription not found for this event.' }, { status: 404 });
      }

      const body = await req.json();
      const data = parseWithZod(setTotemLocationRequestSchema, body);

      const controller = makeSetTotemLocationController();
      const result = await controller.handle(subscriptionId, data);

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
  withRBAC(['TOTEM_UPDATE'], async (_req: NextRequest, context: RouteContext) => {
    const { eventId, subscriptionId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(_req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const subscription = await prisma.totemEventSubscription.findUnique({
      where: { id: subscriptionId },
      select: { eventId: true },
    });

    if (!subscription || subscription.eventId !== eventId) {
      return NextResponse.json({ error: 'Subscription not found for this event.' }, { status: 404 });
    }

    const controller = makeUnlinkTotemFromEventController();
    const result = await controller.handle(subscriptionId);

    return toNextResponse(result);
  }),
);
