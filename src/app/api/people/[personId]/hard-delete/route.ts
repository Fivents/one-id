import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedPerson } from '../../_lib/access';

export const DELETE = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    const { personId } = await context.params;

    const personOrResponse = await getAuthorizedPerson(req, personId, true);
    if (personOrResponse instanceof Response) {
      return personOrResponse;
    }

    await prisma.person.delete({ where: { id: personId } });

    return new NextResponse(null, { status: 204 });
  }),
);
