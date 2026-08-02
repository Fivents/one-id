import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { generateCheckInCredential, resolveTotemAccessCodeLength } from '@/core/utils/checkin-credentials';

import { getAuthorizedEvent } from '../../../_lib/access';

const CHUNK_SIZE = 500;

export const GET = withAuth(
  withRBAC(['PARTICIPANT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const eligibleCount = await prisma.person.count({
      where: {
        organizationId: eventOrResponse.organizationId,
        deletedAt: null,
        eventParticipants: { none: { eventId, deletedAt: null } },
      },
    });

    return NextResponse.json({ eligibleCount }, { status: 200 });
  }),
);

export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const body = await req.json().catch(() => ({}));
    const cursor = typeof body.cursor === 'string' ? body.cursor : undefined;

    const credentialLength = await resolveTotemAccessCodeLength(prisma, eventOrResponse.organizationId);

    const eligiblePeople = await prisma.person.findMany({
      where: {
        organizationId: eventOrResponse.organizationId,
        deletedAt: null,
        eventParticipants: { none: { eventId, deletedAt: null } },
      },
      select: { id: true, accessCode: true, accessCodeProvenance: true, qrCodeValue: true, qrCodeProvenance: true },
      orderBy: { id: 'asc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: CHUNK_SIZE,
    });

    let processedCount = 0;
    const failedPersonIds: string[] = [];

    for (const person of eligiblePeople) {
      try {
        await prisma.eventParticipant.create({
          data: {
            personId: person.id,
            eventId,
            qrCodeValue: person.qrCodeValue ?? generateCheckInCredential(credentialLength),
            accessCode: person.accessCode ?? generateCheckInCredential(credentialLength),
            accessCodeProvenance: person.accessCode ? person.accessCodeProvenance : 'RANDOM',
            qrCodeProvenance: person.qrCodeValue ? person.qrCodeProvenance : 'RANDOM',
          },
        });
        processedCount++;
      } catch (error) {
        // Never let one bad record abort the whole chunk — log and keep going.
        console.error(`Failed to backfill event ${eventId} for person ${person.id}`, error);
        failedPersonIds.push(person.id);
      }
    }

    if (processedCount > 0) {
      const auth = getUserAuth(req);
      await prisma.auditLog.create({
        data: {
          action: 'EVENT_AUTO_LINK_BACKFILL',
          description: `Auto-link backfill linked ${processedCount} people to event.`,
          metadata: { eventId, linkedCount: processedCount, failedCount: failedPersonIds.length, cursor: cursor ?? null },
          eventId,
          organizationId: eventOrResponse.organizationId,
          userId: auth.userId,
        },
      });
    }

    const nextCursor = eligiblePeople.length === CHUNK_SIZE ? eligiblePeople[eligiblePeople.length - 1].id : null;

    return NextResponse.json(
      {
        processedCount,
        failedCount: failedPersonIds.length,
        remaining: nextCursor !== null,
        nextCursor,
      },
      { status: 200 },
    );
  }),
);
