import { describe, expect, it, vi } from 'vitest';

import { SymplaCheckInMirrorService } from '@/core/application/services/sympla/sympla-checkin-mirror.service';
import { SymplaApiError } from '@/core/errors';

type CheckInRow = {
  id: string;
  checkedInAt: Date;
  eventParticipant: {
    id: string;
    symplaParticipantId: string | null;
    ticketNumber: string | null;
    symplaCheckedIn: boolean | null;
    eventId: string;
    event: { organizationId: string; symplaEventLink: { symplaEventIdHash: string } | null };
  };
};

function makeCheckIn(overrides: Partial<CheckInRow['eventParticipant']> = {}): CheckInRow {
  return {
    id: 'ci-1',
    checkedInAt: new Date('2026-10-15T13:05:00Z'),
    eventParticipant: {
      id: 'ep-1',
      symplaParticipantId: 'P-1001',
      ticketNumber: 'TCK-0001',
      symplaCheckedIn: false,
      eventId: 'evt-1',
      event: { organizationId: 'org-1', symplaEventLink: { symplaEventIdHash: 'hash-1' } },
      ...overrides,
    },
  };
}

function makeHarness(checkIn: CheckInRow | null, clientBehaviour: 'ok' | SymplaApiError = 'ok') {
  const updates: Array<{ where: unknown; data: Record<string, unknown> }> = [];
  const audits: Array<Record<string, unknown>> = [];

  const db = {
    checkIn: { findUnique: vi.fn(async () => checkIn) },
    eventParticipant: {
      update: vi.fn(async (args: { where: unknown; data: Record<string, unknown> }) => {
        updates.push(args);
        return {};
      }),
    },
    auditLog: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        audits.push(args.data);
        return {};
      }),
    },
  };

  const checkInByParticipantId = vi.fn(async () => {
    if (clientBehaviour !== 'ok') throw clientBehaviour;
    return { check_in: true, check_in_date: '2026-10-15T13:05:00Z', check_in_id: 987 };
  });
  const checkInByTicketNumber = vi.fn(async () => {
    if (clientBehaviour !== 'ok') throw clientBehaviour;
    return { check_in: true, check_in_date: '2026-10-15T13:05:00Z', check_in_id: 988 };
  });

  const clientProvider = {
    forOrganization: vi.fn(async () => ({
      client: { checkInByParticipantId, checkInByTicketNumber },
      connection: {},
    })),
  };

  const service = new SymplaCheckInMirrorService(
    db as never,
    clientProvider as never,
  );

  return { service, db, updates, audits, checkInByParticipantId, checkInByTicketNumber, clientProvider };
}

describe('SymplaCheckInMirrorService', () => {
  it('pushes the check-in and records what Sympla returned', async () => {
    const harness = makeHarness(makeCheckIn());

    await expect(harness.service.mirror('ci-1')).resolves.toBe('MIRRORED');

    expect(harness.checkInByParticipantId).toHaveBeenCalledWith('hash-1', 'P-1001');
    expect(harness.updates[0].data).toMatchObject({ symplaCheckedIn: true, symplaCheckInId: 987 });
    // Our own timestamp wins: it is when the attendee actually passed the gate.
    expect(harness.updates[0].data.symplaCheckInDate).toEqual(new Date('2026-10-15T13:05:00Z'));
    expect(harness.audits[0]).toMatchObject({ action: 'SYMPLA_CHECKIN_MIRRORED' });
  });

  it('falls back to the ticket number when no participant id was synced', async () => {
    const harness = makeHarness(makeCheckIn({ symplaParticipantId: null }));

    await expect(harness.service.mirror('ci-1')).resolves.toBe('MIRRORED');

    expect(harness.checkInByParticipantId).not.toHaveBeenCalled();
    expect(harness.checkInByTicketNumber).toHaveBeenCalledWith('hash-1', 'TCK-0001');
  });

  it('is idempotent — a ticket Sympla already has is left alone', async () => {
    const harness = makeHarness(makeCheckIn({ symplaCheckedIn: true }));

    await expect(harness.service.mirror('ci-1')).resolves.toBe('ALREADY_MIRRORED');
    expect(harness.checkInByParticipantId).not.toHaveBeenCalled();
  });

  it('ignores a participant that did not come from Sympla', async () => {
    const harness = makeHarness(makeCheckIn({ symplaParticipantId: null, ticketNumber: null }));

    await expect(harness.service.mirror('ci-1')).resolves.toBe('NOT_A_SYMPLA_TICKET');
    expect(harness.clientProvider.forOrganization).not.toHaveBeenCalled();
  });

  it('ignores an event with no Sympla link', async () => {
    const harness = makeHarness(
      makeCheckIn({ event: { organizationId: 'org-1', symplaEventLink: null } }),
    );

    await expect(harness.service.mirror('ci-1')).resolves.toBe('NOT_A_SYMPLA_TICKET');
  });

  it('tolerates a check-in invalidated between enqueue and run', async () => {
    const harness = makeHarness(null);

    await expect(harness.service.mirror('ci-gone')).resolves.toBe('CHECK_IN_GONE');
  });

  it('gives up on a definitive rejection instead of retrying forever', async () => {
    const rejection = new SymplaApiError(404, { detail: 'not found' });
    const harness = makeHarness(makeCheckIn(), rejection);

    // Resolving rather than throwing is what tells the queue to stop.
    await expect(harness.service.mirror('ci-1')).resolves.toBe('REJECTED_BY_SYMPLA');
    expect(harness.audits[0]).toMatchObject({ action: 'SYMPLA_CHECKIN_MIRRORED' });
    expect(harness.audits[0].metadata).toMatchObject({ rejected: true, upstreamStatus: 404 });
  });

  it('rethrows a retryable failure so the queue backs off', async () => {
    const transient = new SymplaApiError(503);
    const harness = makeHarness(makeCheckIn(), transient);

    await expect(harness.service.mirror('ci-1')).rejects.toThrowError(SymplaApiError);
    expect(harness.updates).toHaveLength(0);
  });

  it('treats a rate limit as retryable', async () => {
    const harness = makeHarness(makeCheckIn(), new SymplaApiError(429));

    await expect(harness.service.mirror('ci-1')).rejects.toMatchObject({ code: 'SYMPLA_RATE_LIMITED' });
  });
});
