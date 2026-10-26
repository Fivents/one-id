import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { CountMismatchError, countMismatchResponse, deleteAllMatching } from '@/app/api/_lib/delete-all';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { getAuthorizedEvent } from '../../../_lib/access';
import { buildParticipantsWhere } from '../_lib/participants-filters';

// "Delete all": soft-deletes every participant of the event that matches the listing's search,
// the same operation as removing them one by one. `expectedCount` is the number the user
// confirmed; if the set changed since, the transaction is rolled back and nothing is removed.
const bulkDeleteParticipantsSchema = z.object({
  all: z.literal(true),
  search: z.string().optional(),
  expectedCount: z.number().int().min(1),
});

export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const data = parseWithZod(bulkDeleteParticipantsSchema, await req.json());
      const where = buildParticipantsWhere(eventId, { search: data.search });

      const result = await deleteAllMatching(() =>
        prisma.$transaction(async (tx) => {
          const { count } = await tx.eventParticipant.updateMany({ where, data: { deletedAt: new Date() } });
          if (count !== data.expectedCount) throw new CountMismatchError(count);
          return count;
        }),
      );

      if (result.conflict) {
        return countMismatchResponse(result.actual);
      }

      return NextResponse.json({ success: true, deleted: result.count }, { status: 200 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
