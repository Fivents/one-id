import { NextRequest, NextResponse } from 'next/server';

import {
  makeGetParticipantController,
  makeRemoveParticipantController,
  makeUpdateParticipantController,
} from '@/core/application/controller-factories';
import { updateParticipantRequestSchema } from '@/core/communication/requests/event-participant';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { getAuthorizedEvent } from '../../events/_lib/access';

export const GET = withAuth(
  withRBAC(['PARTICIPANT_VIEW'], async (_req: NextRequest, context: RouteContext) => {
    const { participantId } = await context.params;

    const participant = await prisma.eventParticipant.findUnique({
      where: { id: participantId, deletedAt: null },
      select: { eventId: true },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });
    }

    const eventOrResponse = await getAuthorizedEvent(_req, participant.eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const controller = makeGetParticipantController();
    const result = await controller.handle(participantId);

    return toNextResponse(result);
  }),
);

export const PATCH = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { participantId } = await context.params;

      const participant = await prisma.eventParticipant.findUnique({
        where: { id: participantId, deletedAt: null },
        select: { eventId: true },
      });

      if (!participant) {
        return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });
      }

      const eventOrResponse = await getAuthorizedEvent(req, participant.eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const body = await req.json();
      const data = parseWithZod(updateParticipantRequestSchema, body);

      const controller = makeUpdateParticipantController();
      const result = await controller.handle(participantId, data);

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
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    const { participantId } = await context.params;

    const participant = await prisma.eventParticipant.findUnique({
      where: { id: participantId, deletedAt: null },
      select: { eventId: true },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });
    }

    const eventOrResponse = await getAuthorizedEvent(req, participant.eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const controller = makeRemoveParticipantController();
    const result = await controller.handle(participantId);

    return toNextResponse(result);
  }),
);
