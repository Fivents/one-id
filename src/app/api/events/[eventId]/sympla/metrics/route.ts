import { NextRequest, NextResponse } from 'next/server';

import { containerService } from '@/core/application/services/container.service';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';

import { getAuthorizedEvent } from '../../../_lib/access';

/** Attendance and revenue broken down by ticket type, sector and marketing source. */
export const GET = withAuth(
  withRBAC(['CHECKIN_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const metrics = await containerService.getSymplaMetricsService().forEvent(eventId);

    return NextResponse.json(metrics, { status: 200 });
  }),
);
