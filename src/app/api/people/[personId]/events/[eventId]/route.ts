import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { generateCheckInCredential, resolveTotemAccessCodeLength } from '@/core/utils/checkin-credentials';
import { Prisma } from '@/generated/prisma/client';

import { getAuthorizedPerson } from '../../../_lib/access';

export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
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

      const credentialLength = await resolveTotemAccessCodeLength(prisma, event.organizationId);
      const qrCodeValue = generateCheckInCredential(credentialLength);
      const accessCode = generateCheckInCredential(credentialLength);

      const existing = await prisma.eventParticipant.findFirst({
        where: { eventId, personId },
        select: { id: true, deletedAt: true },
      });

      if (existing) {
        if (existing.deletedAt) {
          const restored = await prisma.eventParticipant.update({
            where: { id: existing.id },
            data: {
              qrCodeValue,
              accessCode,
              deletedAt: null,
            },
          });

          return NextResponse.json(restored, { status: 200 });
        }

        return NextResponse.json({ error: 'Participant already linked to this event.' }, { status: 409 });
      }

      const participant = await prisma.eventParticipant.create({
        data: {
          personId,
          eventId,
          qrCodeValue,
          accessCode,
        },
      });

      return NextResponse.json(participant, { status: 201 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'QR code or access code already in use for this event.' }, { status: 409 });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
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
