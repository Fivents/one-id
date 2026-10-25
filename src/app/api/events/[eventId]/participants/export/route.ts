import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import {
  resolveParticipantDocument,
  resolveParticipantEmail,
  resolveParticipantName,
} from '@/core/utils/participant-identity';

import { getAuthorizedEvent } from '../../../_lib/access';

export const GET = withAuth(
  withRBAC(['PARTICIPANT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const participants = await prisma.eventParticipant.findMany({
      where: { eventId, deletedAt: null },
      include: {
        person: {
          select: {
            name: true,
            email: true,
            document: true,
            phone: true,
            jobTitle: true,
            birthDate: true,
            notes: true,
            deletedAt: true,
          },
        },
        checkIns: {
          select: { checkedInAt: true },
          orderBy: { checkedInAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = participants.map((p) => ({
      name: resolveParticipantName(p),
      email: resolveParticipantEmail(p),
      document: resolveParticipantDocument(p),
      // Person-only columns: a ticket slot with no identity simply has nothing to export here.
      phone: p.person?.phone ?? null,
      jobTitle: p.person?.jobTitle ?? p.jobTitle ?? null,
      birthDate: p.person?.birthDate ?? null,
      notes: p.person?.notes ?? null,
      deletedAt: p.person?.deletedAt ?? null,
      company: p.company,
      accessCode: p.accessCode,
      qrCodeValue: p.qrCodeValue,
      hasCheckIn: p.checkIns.length > 0,
      checkedInAt: p.checkIns[0]?.checkedInAt ?? null,
    }));

    return NextResponse.json(result, { status: 200 });
  }),
);
