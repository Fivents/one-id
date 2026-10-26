import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { CountMismatchError, countMismatchResponse, deleteAllMatching } from '@/app/api/_lib/delete-all';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { assertOrganizationAccess } from '../_lib/access';
import { buildPeopleWhere } from '../_lib/people-filters';

const bulkDeletePeopleSchema = z.union([
  z.object({
    personIds: z.array(z.string().min(1)).min(1),
    organizationId: z.string().min(1),
  }),
  // "Delete all": every active person matching the listing's search. `expectedCount` is the
  // number the user confirmed; if the set changed since (an import, another admin), nothing
  // is deleted rather than deleting more — or other — people than they agreed to.
  z.object({
    all: z.literal(true),
    organizationId: z.string().min(1),
    search: z.string().optional(),
    expectedCount: z.number().int().min(1),
  }),
]);

export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(bulkDeletePeopleSchema, body);

      const accessError = await assertOrganizationAccess(req, data.organizationId);
      if (accessError) {
        return accessError;
      }

      if ('all' in data) {
        const where = buildPeopleWhere({ organizationId: data.organizationId, search: data.search });
        const result = await deleteAllMatching(() =>
          prisma.$transaction(async (tx) => {
            const { count } = await tx.person.updateMany({ where, data: { deletedAt: new Date() } });
            // Throwing rolls the update back, so a mismatch never leaves a partial delete.
            if (count !== data.expectedCount) throw new CountMismatchError(count);
            return count;
          }),
        );

        if (result.conflict) {
          return countMismatchResponse(result.actual);
        }

        return NextResponse.json({ success: true, deleted: result.count }, { status: 200 });
      }

      await prisma.person.updateMany({
        where: {
          id: { in: data.personIds },
          organizationId: data.organizationId,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
