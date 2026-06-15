import { NextRequest, NextResponse } from 'next/server';

import { PrintJobService } from '@/core/application/services/print-job.service';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { PrismaPrintJobRepository } from '@/core/infrastructure/repositories/prisma-print-job.repository';

import { getAuthorizedEvent } from '../../../_lib/access';

export const GET = withAuth(
  withRBAC(['EVENT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const searchParams = req.nextUrl.searchParams;
      const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '50', 10)));

      const printJobRepo = new PrismaPrintJobRepository(prisma);
      const printJobService = new PrintJobService(printJobRepo);

      const { jobs, total } = await printJobService.getHistoryByEventId(eventId, page, pageSize);

      return NextResponse.json({
        jobs: jobs.map((job) => ({
          id: job.id,
          status: job.status,
          copies: job.copies,
          errorMessage: job.errorMessage,
          printedAt: job.printedAt?.toISOString() ?? null,
          eventParticipantId: job.eventParticipantId,
          checkInId: job.checkInId,
          totemId: job.totemId,
          createdAt: job.createdAt.toISOString(),
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }),
);
