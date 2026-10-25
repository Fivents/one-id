/**
 * Exercises the metrics SQL against the real database. Read-only.
 *
 * Runs against the biggest event available as well as the linked one: the aggregation has to be
 * correct at a few thousand rows, and the fan-out bug it is written to avoid (joining check_ins
 * instead of EXISTS) only shows up once participants actually have check-ins.
 */

import { loadEnvFile } from 'node:process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let prisma: typeof import('@/core/infrastructure/prisma-client').prisma;
let containerService: typeof import('@/core/application/services/container.service').containerService;

beforeAll(async () => {
  try {
    loadEnvFile('.env');
  } catch {
    /* already loaded */
  }

  ({ prisma } = await import('@/core/infrastructure/prisma-client'));
  ({ containerService } = await import('@/core/application/services/container.service'));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Sympla metrics against real data', () => {
  it('aggregates the largest event correctly', async () => {
    const events = await prisma.event.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, _count: { select: { participants: true } } },
    });

    const biggest = [...events].sort((a, b) => b._count.participants - a._count.participants)[0];
    expect(biggest, 'no events in the database').toBeTruthy();

    const metrics = await containerService.getSymplaMetricsService().forEvent(biggest.id);

     
    console.info(`[metrics] "${biggest.name}" (${biggest._count.participants} participants):`, {
      totals: metrics.totals,
      ticketTypes: metrics.byTicketType.length,
      sectors: metrics.bySector.length,
      utm: metrics.byUtmSource.length,
    });

    // Cross-check the headline numbers against plain Prisma counts, which is the point: if the
    // raw SQL fanned out, these would disagree.
    const [participantCount, checkedInCount] = await Promise.all([
      prisma.eventParticipant.count({ where: { eventId: biggest.id, deletedAt: null } }),
      prisma.eventParticipant.count({
        where: { eventId: biggest.id, deletedAt: null, checkIns: { some: {} } },
      }),
    ]);

    expect(metrics.totals.tickets).toBe(participantCount);
    expect(metrics.totals.checkedIn).toBe(checkedInCount);

    // Breakdown rows must sum back to the whole; a GROUP BY that dropped or duplicated rows
    // would show up here and nowhere else.
    const summed = metrics.byTicketType.reduce((total, row) => total + row.tickets, 0);
    expect(summed).toBe(participantCount);

    const summedSectors = metrics.bySector.reduce((total, row) => total + row.tickets, 0);
    expect(summedSectors).toBe(participantCount);

    // A rate is a share of valid tickets, so it can never exceed 1.
    for (const row of [...metrics.byTicketType, ...metrics.bySector]) {
      if (row.checkInRate !== null) {
        expect(row.checkInRate).toBeGreaterThanOrEqual(0);
        expect(row.checkInRate).toBeLessThanOrEqual(1);
      }
    }
  });

  it('holds its invariants on a linked event, whatever is synced there', async () => {
    const link = await prisma.symplaEventLink.findFirst({ select: { eventId: true } });
    if (!link) return;

    const metrics = await containerService.getSymplaMetricsService().forEvent(link.eventId);

     
    console.info('[metrics] linked event:', metrics.totals);

    // Asserting invariants rather than a count: real tickets arrive on this event over time, and
    // a test that hardcodes "0" fails the moment the integration starts working.
    const participants = await prisma.eventParticipant.count({
      where: { eventId: link.eventId, deletedAt: null },
    });

    expect(metrics.totals.tickets).toBe(participants);
    expect(metrics.totals.valid + metrics.totals.cancelled).toBe(metrics.totals.tickets);
    expect(metrics.totals.checkedIn).toBeLessThanOrEqual(metrics.totals.tickets);

    if (metrics.totals.valid === 0) {
      expect(metrics.totals.checkInRate).toBeNull();
    } else {
      expect(metrics.totals.checkInRate).not.toBeNull();
    }
  });
});
