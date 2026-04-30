import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { assertOrganizationAccess } from '../_lib/access';

const bulkDeletePeopleSchema = z.object({
  personIds: z.array(z.string().min(1)).min(1),
  organizationId: z.string().min(1),
});

export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(bulkDeletePeopleSchema, body);

      const accessError = await assertOrganizationAccess(req, data.organizationId);
      if (accessError) {
        return accessError;
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
