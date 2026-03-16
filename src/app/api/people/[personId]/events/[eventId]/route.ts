import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedPerson } from '../../../_lib/access';

export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    const { personId, eventId } = await context.params;

    const personOrResponse = await getAuthorizedPerson(req, personId);
    if (personOrResponse instanceof Response) {
      return personOrResponse;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: { id: true, organizationId: true },
    });

    if (!event || event.organizationId !== personOrResponse.organizationId) {
      return NextResponse.json({ error: 'Event not found for this organization.' }, { status: 404 });
    }

    const existing = await prisma.eventParticipant.findFirst({
      where: { eventId, personId },
      select: { id: true, deletedAt: true },
    });

    if (existing) {
      if (existing.deletedAt) {
        const restored = await prisma.eventParticipant.update({
          where: { id: existing.id },
          data: { deletedAt: null },
        });

        return NextResponse.json(restored, { status: 200 });
      }

      return NextResponse.json({ error: 'Participant already linked to this event.' }, { status: 409 });
    }

    const participant = await prisma.eventParticipant.create({
      data: { personId, eventId },
    });

    return NextResponse.json(participant, { status: 201 });
  }),
);

export const DELETE = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    const { personId, eventId } = await context.params;

    const personOrResponse = await getAuthorizedPerson(req, personId);
    if (personOrResponse instanceof Response) {
      return personOrResponse;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: { id: true, organizationId: true },
    });

    if (!event || event.organizationId !== personOrResponse.organizationId) {
      return NextResponse.json({ error: 'Event not found for this organization.' }, { status: 404 });
    }

    const participant = await prisma.eventParticipant.findFirst({
      where: { eventId, personId, deletedAt: null },
      select: { id: true },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Person is not linked to this event.' }, { status: 404 });
    }

    await prisma.eventParticipant.update({
      where: { id: participant.id },
      data: { deletedAt: new Date() },
    });

    return new NextResponse(null, { status: 204 });
  }),
);
