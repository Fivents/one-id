/**
 * Mirrors real check-ins to the real Sympla API.
 *
 * Gated behind SYMPLA_ALLOW_WRITES=1 on top of `pnpm test:live`. Everything else in tests/live is
 * read-only against Sympla; this file checks actual people in on the organizer's event, which
 * shows up in their panel and app. A test that mutates someone else's system must not run by
 * accident, so the default is that it skips.
 */

import { loadEnvFile } from 'node:process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { SymplaHttpClient } from '@/core/infrastructure/http/sympla/sympla-http.client';

const WRITES_ALLOWED = process.env.SYMPLA_ALLOW_WRITES === '1';
const MAX_TICKETS = 3;

let prisma: typeof import('@/core/infrastructure/prisma-client').prisma;
let containerService: typeof import('@/core/application/services/container.service').containerService;
let client: SymplaHttpClient;
let eventId: string;
let symplaEventIdHash: string;

beforeAll(async () => {
  try {
    loadEnvFile('.env');
  } catch {
    /* already loaded */
  }

  ({ prisma } = await import('@/core/infrastructure/prisma-client'));
  ({ containerService } = await import('@/core/application/services/container.service'));

  client = new SymplaHttpClient({ token: process.env.SYMPLA_TEST_TOKEN as string, maxRetries: 2 });

  const link = await prisma.symplaEventLink.findFirst({
    select: { eventId: true, symplaEventIdHash: true },
  });

  eventId = link?.eventId ?? '';
  symplaEventIdHash = link?.symplaEventIdHash ?? '';
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe.skipIf(!WRITES_ALLOWED)('mirroring real check-ins to Sympla', () => {
  it('pushes local check-ins and Sympla confirms them', async () => {
    expect(eventId, 'no linked event').toBeTruthy();

    // Only tickets Sympla does not already consider checked in, so a re-run is a no-op rather
    // than a second write.
    const slots = await prisma.eventParticipant.findMany({
      where: {
        eventId,
        deletedAt: null,
        ticketNumber: { not: null },
        OR: [{ symplaCheckedIn: null }, { symplaCheckedIn: false }],
        checkIns: { none: {} },
      },
      select: { id: true, ticketNumber: true, symplaParticipantId: true },
      take: MAX_TICKETS,
    });

    if (slots.length === 0) {
       
      console.warn('[mirror] every ticket is already checked in on Sympla — nothing left to push');
      return;
    }

     
    console.info(
      `[mirror] checking in ${slots.length} ticket(s):`,
      slots.map((slot) => slot.ticketNumber),
    );

    const { enqueueMirrorCheckIn } = await import(
      '@/core/application/services/sympla/enqueue-mirror-checkin'
    );
    const { drainJobs } = await import('@/core/infrastructure/jobs');

    for (const slot of slots) {
      const checkIn = await prisma.checkIn.create({
        data: {
          method: 'QR_CODE',
          confidence: null,
          checkedInAt: new Date(),
          eventParticipantId: slot.id,
          totemEventSubscriptionId: null,
        },
        select: { id: true },
      });

      await enqueueMirrorCheckIn(checkIn.id);
    }

    const drained = await drainJobs({
      queue: containerService.getJobQueue(),
      maxJobs: MAX_TICKETS + 2,
      budgetMs: 45_000,
    });

     
    console.info('[mirror] drain:', drained);

    expect(drained.failed).toBe(0);

    // Our own record of Sympla's answer.
    const updated = await prisma.eventParticipant.findMany({
      where: { id: { in: slots.map((slot) => slot.id) } },
      select: { ticketNumber: true, symplaCheckedIn: true, symplaCheckInId: true, symplaCheckInDate: true },
    });

     
    console.info('[mirror] local state after mirroring:', updated);

    for (const slot of updated) {
      expect(slot.symplaCheckedIn, `${slot.ticketNumber} should be marked mirrored`).toBe(true);
      // check_in_id is documented but absent from both live response shapes, so it stays null.
    }

    // And the only answer that really counts: ask Sympla directly. Reads are eventually
    // consistent — a GET right after the POST can still say false — so give it a moment.
    await new Promise((resolve) => setTimeout(resolve, 5_000));

    for (const slot of slots) {
      const participant = await client.getParticipantByTicketNumber(
        symplaEventIdHash,
        slot.ticketNumber as string,
      );

       
      console.info(`[mirror] Sympla says ${slot.ticketNumber}:`, participant.checkin);

      expect(participant.checkin?.check_in, `Sympla should report ${slot.ticketNumber} as checked in`).toBe(
        true,
      );
    }
  });

  it('is idempotent — re-mirroring an already-pushed check-in does nothing', async () => {
    const alreadyMirrored = await prisma.eventParticipant.findFirst({
      where: { eventId, symplaCheckedIn: true, checkIns: { some: {} } },
      select: { checkIns: { select: { id: true }, take: 1 } },
    });

    if (!alreadyMirrored?.checkIns[0]) return;

    const outcome = await containerService
      .getSymplaCheckInMirrorService()
      .mirror(alreadyMirrored.checkIns[0].id);

     
    console.info('[mirror] second attempt outcome:', outcome);

    expect(outcome).toBe('ALREADY_MIRRORED');
  });

  it('a later sync does not un-mark what was already mirrored', async () => {
    // The sync re-reads checkin.check_in on every pass. Because that read is eventually
    // consistent, it must never downgrade a slot we already know is mirrored and for which we
    // hold the gate record — otherwise the reconciler re-pushes it forever.
    await containerService.getSymplaSyncService().syncEvent({ eventId, participantsOnly: true });

    const disagreements = await prisma.$queryRaw<Array<{ ticket_number: string }>>`
      SELECT ticket_number
      FROM event_participants ep
      WHERE ep.event_id = ${eventId}
        AND ep.deleted_at IS NULL
        AND EXISTS (SELECT 1 FROM check_ins ci WHERE ci.event_participant_id = ep.id)
        AND COALESCE(ep.sympla_checked_in, false) = false
    `;

     
    console.info('[mirror] tickets checked in here but not on Sympla:', disagreements);

    expect(disagreements).toEqual([]);
  });
});
