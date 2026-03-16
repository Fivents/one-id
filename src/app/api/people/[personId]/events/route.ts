import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedPerson } from '../../_lib/access';

export const GET = withAuth(
  withRBAC(['PARTICIPANT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { personId } = await context.params;

    const personOrResponse = await getAuthorizedPerson(req, personId, true);
    if (personOrResponse instanceof Response) {
      return personOrResponse;
    }

    const events = await prisma.event.findMany({
      where: {
        organizationId: personOrResponse.organizationId,
        deletedAt: null,
      },
      include: {
        participants: {
          where: {
            personId,
            deletedAt: null,
          },
          select: { id: true },
        },
      },
      orderBy: { startsAt: 'desc' },
    });

    return NextResponse.json(
      events.map((event) => ({
        id: event.id,
        name: event.name,
        slug: event.slug,
        status: event.status,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        linked: event.participants.length > 0,
      })),
      { status: 200 },
    );
  }),
);
