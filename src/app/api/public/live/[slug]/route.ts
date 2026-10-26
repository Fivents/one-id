import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/core/infrastructure/prisma-client';
import { resolveParticipantName } from '@/core/utils/participant-identity';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * Public read-only endpoint for live check-in data.
 * Returns sanitized metrics without exposing sensitive participant data.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  const event = await prisma.event.findUnique({
    where: { publicSlug: slug },
    select: {
      id: true,
      name: true,
      startsAt: true,
      endsAt: true,
      status: true,
      deletedAt: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!event || event.deletedAt) {
    return NextResponse.json({ error: 'Event not found or link expired' }, { status: 404 });
  }

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  const [totalParticipants, presentParticipants, totalCheckIns, checkInsLastMinute, recentCheckIns] = await Promise.all(
    [
      prisma.eventParticipant.count({
        where: { eventId: event.id, deletedAt: null },
      }),
      // A participant can check in more than once (re-entry at another gate), so the rate counts
      // people with at least one check-in, not check-in records — otherwise it can exceed 100%.
      prisma.eventParticipant.count({
        where: { eventId: event.id, deletedAt: null, checkIns: { some: {} } },
      }),
      prisma.checkIn.count({
        where: {
          eventParticipant: { eventId: event.id, deletedAt: null },
        },
      }),
      prisma.checkIn.count({
        where: {
          eventParticipant: { eventId: event.id, deletedAt: null },
          checkedInAt: { gte: oneMinuteAgo },
        },
      }),
      prisma.checkIn.findMany({
        where: {
          eventParticipant: { eventId: event.id, deletedAt: null },
        },
        orderBy: [{ checkedInAt: 'desc' }, { id: 'desc' }],
        take: 10,
        select: {
          id: true,
          method: true,
          checkedInAt: true,
          eventParticipant: {
            select: {
              person: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ],
  );

  const checkInRate = totalParticipants > 0 ? Math.round((presentParticipants / totalParticipants) * 100) : 0;

  return NextResponse.json({
    organizationName: event.organization.name,
    event: {
      name: event.name,
      status: event.status,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
    },
    metrics: {
      totalParticipants,
      presentParticipants,
      totalCheckIns,
      checkInRate,
      checkInsLastMinute,
    },
    recentCheckIns: recentCheckIns.map((checkIn) => ({
      id: checkIn.id,
      name: maskName(resolveParticipantName(checkIn.eventParticipant)),
      method: checkIn.method,
      checkedInAt: checkIn.checkedInAt,
    })),
    updatedAt: now.toISOString(),
  });
}

/**
 * Masks the name for privacy: "John Doe" -> "J*** D**"
 */
function maskName(name: string): string {
  return name
    .split(' ')
    .map((part) => {
      if (part.length <= 1) return part;
      return part[0] + '*'.repeat(Math.min(part.length - 1, 3));
    })
    .join(' ');
}
