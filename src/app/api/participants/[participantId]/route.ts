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
import { generateCheckInCredential, resolveTotemAccessCodeLength } from '@/core/utils/checkin-credentials';
import { parseWithZod } from '@/core/utils/parse-with-zod';
import { Prisma } from '@/generated/prisma/client';

import { getAuthorizedEvent } from '../../events/_lib/access';

function normalizeDocumentAsAccessCode(document: string | null | undefined): string | null {
  const normalized = document?.trim();
  return normalized ? normalized.toUpperCase() : null;
}

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
        select: { eventId: true, personId: true, accessCode: true, useDocumentAsAccessCode: true },
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

      const person = await prisma.person.findUnique({
        where: { id: participant.personId, deletedAt: null },
        select: { document: true },
      });

      const documentAccessCode = normalizeDocumentAsAccessCode(person?.document);
      const requestedUseDocumentAsAccessCode = data.useDocumentAsAccessCode ?? participant.useDocumentAsAccessCode;

      const event = eventOrResponse;
      const credentialLength = await resolveTotemAccessCodeLength(prisma, event.organizationId);
      const shouldRegenerateStandardCode =
        participant.useDocumentAsAccessCode &&
        requestedUseDocumentAsAccessCode === false &&
        data.accessCode === undefined;

      const fallbackAccessCode = shouldRegenerateStandardCode
        ? generateCheckInCredential(credentialLength)
        : data.accessCode !== undefined
          ? data.accessCode?.trim().toUpperCase() || null
          : participant.accessCode || generateCheckInCredential(credentialLength);

      const resolvedAccessCode = requestedUseDocumentAsAccessCode && documentAccessCode ? documentAccessCode : fallbackAccessCode;

      const controller = makeUpdateParticipantController();
      const result = await controller.handle(participantId, {
        ...data,
        useDocumentAsAccessCode: requestedUseDocumentAsAccessCode,
        accessCode: resolvedAccessCode,
      });

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'QR code or access code already in use for this event.' }, { status: 409 });
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
