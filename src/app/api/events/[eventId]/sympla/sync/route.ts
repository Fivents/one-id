import { NextRequest, NextResponse } from 'next/server';

import { containerService } from '@/core/application/services/container.service';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { JOB_KIND } from '@/core/infrastructure/jobs';

import { getAuthorizedEvent } from '../../../_lib/access';

/**
 * "Sync now". Enqueues rather than syncing inline: a full pass over a large event runs for
 * minutes, which no HTTP request should hold open. The dedupe key means mashing the button
 * cannot stack up duplicate runs.
 */
export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const link = await containerService.getSymplaEventLinkRepository().findByEventId(eventId);

      if (!link) {
        return NextResponse.json(
          { error: 'Este evento não está vinculado a um evento da Sympla.', code: 'SYMPLA_EVENT_NOT_LINKED' },
          { status: 404 },
        );
      }

      const outcome = await containerService.getJobQueue().enqueue({
        kind: JOB_KIND.SYMPLA_SYNC_EVENT,
        payload: { eventId },
        dedupeKey: `sympla:event:${eventId}`,
        organizationId: eventOrResponse.organizationId,
      });

      return NextResponse.json(
        { enqueued: !outcome.deduped, alreadyRunning: outcome.deduped },
        { status: 202 },
      );
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
