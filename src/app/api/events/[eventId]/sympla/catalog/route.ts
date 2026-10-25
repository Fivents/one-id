import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedEvent } from '../../../_lib/access';

/**
 * The sectors and ticket types known for an event, for the gate-restriction pickers.
 *
 * Sector names are read from the synced catalogue AND from the tickets themselves: a ticket can
 * name a sector that no presentation declared, and a gate that cannot be configured for a sector
 * its own attendees carry would be useless.
 */
export const GET = withAuth(
  withRBAC(['EVENT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const [sectors, ticketTypes, sectorsFromTickets, typesFromTickets] = await Promise.all([
      prisma.sector.findMany({ where: { eventId }, select: { name: true }, orderBy: { name: 'asc' } }),
      prisma.ticketType.findMany({ where: { eventId }, select: { name: true }, orderBy: { name: 'asc' } }),
      prisma.eventParticipant.findMany({
        where: { eventId, deletedAt: null, sectorName: { not: null } },
        select: { sectorName: true },
        distinct: ['sectorName'],
      }),
      prisma.eventParticipant.findMany({
        where: { eventId, deletedAt: null, ticketName: { not: null } },
        select: { ticketName: true },
        distinct: ['ticketName'],
      }),
    ]);

    const uniqueSorted = (values: Array<string | null>) =>
      [...new Set(values.filter((value): value is string => Boolean(value?.trim())))].sort((a, b) =>
        a.localeCompare(b),
      );

    return NextResponse.json(
      {
        sectors: uniqueSorted([
          ...sectors.map((sector) => sector.name),
          ...sectorsFromTickets.map((row) => row.sectorName),
        ]),
        ticketTypes: uniqueSorted([
          ...ticketTypes.map((type) => type.name),
          ...typesFromTickets.map((row) => row.ticketName),
        ]),
      },
      { status: 200 },
    );
  }),
);
