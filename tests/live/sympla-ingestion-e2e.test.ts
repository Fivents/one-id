/**
 * Exercises the real ingestion service against the real database, with a stubbed HTTP client.
 *
 * This is the piece that had never been tested: the policy helpers have unit tests, but
 * SymplaParticipantSyncService.upsertTicket — the code that actually writes a ticket — did not.
 * Sympla having no tickets to sell us is no reason to leave the write path unverified, and the
 * payload shape it would return is already validated against the live API elsewhere.
 *
 * Writes are confined to a dedicated event that is created and torn down by this file.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { symplaParticipantSchema } from '@/core/infrastructure/http/sympla/sympla.schemas';
import type { SymplaHttpClient } from '@/core/infrastructure/http/sympla/sympla-http.client';

const FIVENTS_ORG_ID = '321831fc-5a4a-471a-9e7e-fe2ab5a92df8';
const SLUG = 'teste-sympla-ingestao';

let prisma: typeof import('@/core/infrastructure/prisma-client').prisma;
let SymplaParticipantSyncService: typeof import('@/core/application/services/sympla/sympla-participant-sync.service').SymplaParticipantSyncService;
let eventId: string;

function bulkOrderTickets() {
  const raw = JSON.parse(
    readFileSync(path.resolve(__dirname, '../fixtures/sympla/participants-bulk-order.json'), 'utf8'),
  ) as { data: unknown[] };

  return raw.data.map((item) => symplaParticipantSchema.parse(item));
}

/** Only iterateParticipants is reached by the participant sync. */
function stubClient(tickets: ReturnType<typeof bulkOrderTickets>): SymplaHttpClient {
  return {
    async *iterateParticipants() {
      for (const ticket of tickets) {
        yield ticket;
      }
    },
  } as unknown as SymplaHttpClient;
}

async function cleanup() {
  const event = await prisma.event.findFirst({
    where: { organizationId: FIVENTS_ORG_ID, slug: SLUG },
    select: { id: true },
  });

  if (!event) return;

  const slots = await prisma.eventParticipant.findMany({
    where: { eventId: event.id },
    select: { personId: true },
  });

  // Participants cascade from the event; the Persons the ingestion created do not, so they are
  // removed explicitly to keep the organization's contact base clean between runs.
  const personIds = slots
    .map((slot) => slot.personId)
    .filter((id): id is string => id !== null);

  const checkInIds = await prisma.checkIn.findMany({
    where: { eventParticipant: { eventId: event.id } },
    select: { id: true },
  });

  await prisma.event.delete({ where: { id: event.id } });

  // Mirror jobs reference check-ins by id and have no FK, so they would outlive the event.
  if (checkInIds.length > 0) {
    await prisma.backgroundJob.deleteMany({
      where: { dedupeKey: { in: checkInIds.map((checkIn) => `sympla:checkin:${checkIn.id}`) } },
    });
  }

  if (personIds.length > 0) {
    await prisma.person.deleteMany({ where: { id: { in: personIds } } });
  }
}

beforeAll(async () => {
  try {
    loadEnvFile('.env');
  } catch {
    /* already loaded */
  }

  ({ prisma } = await import('@/core/infrastructure/prisma-client'));
  ({ SymplaParticipantSyncService } = await import(
    '@/core/application/services/sympla/sympla-participant-sync.service'
  ));

  await cleanup();

  const event = await prisma.event.create({
    data: {
      name: '[TESTE SYMPLA] ingestão',
      slug: SLUG,
      timezone: 'America/Sao_Paulo',
      startsAt: new Date('2026-10-05T16:00:00Z'),
      endsAt: new Date('2026-10-09T18:00:00Z'),
      organizationId: FIVENTS_ORG_ID,
      status: 'DRAFT',
      qrEnabled: true,
      codeEnabled: true,
      faceEnabled: false,
    },
    select: { id: true },
  });

  eventId = event.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('ingesting a bulk order', () => {
  it('creates one slot per ticket, even with a repeated e-mail', async () => {
    const service = new SymplaParticipantSyncService(prisma);

    const result = await service.execute({
      eventId,
      organizationId: FIVENTS_ORG_ID,
      symplaEventIdHash: 'stub-hash',
      client: stubClient(bulkOrderTickets()),
      from: null,
    });

     
    console.info('[ingestion] first pass:', result);

    expect(result.errors).toEqual([]);
    expect(result.participantsSynced).toBe(3);
    expect(result.created).toBe(3);
    expect(result.updated).toBe(0);

    const slots = await prisma.eventParticipant.findMany({
      where: { eventId },
      orderBy: { ticketNumber: 'asc' },
      select: {
        ticketNumber: true,
        ticketName: true,
        ticketStatus: true,
        sectorName: true,
        seatLabel: true,
        qrCodeValue: true,
        qrCodeProvenance: true,
        accessCode: true,
        attendeeFullName: true,
        attendeeEmail: true,
        attendeeDocument: true,
        customFields: true,
        symplaCheckedIn: true,
        personId: true,
      },
    });

     
    console.info('[ingestion] slots:', slots);

    expect(slots).toHaveLength(3);
    expect(slots.map((slot) => slot.ticketNumber)).toEqual(['TCK-0001', 'TCK-0002', 'TCK-0003']);
    expect(slots.map((slot) => slot.attendeeFullName)).toEqual([
      'Joana Ribeiro',
      'Carlos Mendes',
      'Convidado Sem Email',
    ]);

    // The whole reason P1a happened: two attendees share the buyer's address, and the third has
    // none. All three must still be separate people.
    const personIds = new Set(slots.map((slot) => slot.personId));
    expect(personIds.size).toBe(3);
    expect([...personIds].every((id) => id !== null)).toBe(true);

    // The Sympla QR must survive verbatim, or the organizer's own scanners stop working.
    expect(slots[0].qrCodeValue).toBe('900100010001');
    expect(slots[1].qrCodeValue).toBe('900100010002');
    expect(slots[2].qrCodeValue).toBe('900100010003');
    expect(slots.every((slot) => slot.qrCodeProvenance === 'MANUAL')).toBe(true);

    // Access codes are per ticket and must not collide, even though two tickets carry the same CPF.
    const accessCodes = new Set(slots.map((slot) => slot.accessCode));
    expect(accessCodes.size).toBe(3);

    // Document comes out of the purchase form, and repeats across the order.
    expect(slots[0].attendeeDocument).toBe('123.456.789-00');
    expect(slots[1].attendeeDocument).toBe('123.456.789-00');
    expect(slots[2].attendeeDocument).toBeNull();

    // '' must not be stored as an e-mail — it would read as a shared address downstream.
    expect(slots[2].attendeeEmail).toBeNull();

    // The cancelled ticket is kept and marked, never dropped from the gate list.
    expect(slots[2].ticketStatus).toBe('C');
    expect(slots[2].symplaCheckedIn).toBe(true);

    expect(slots[0].sectorName).toBe('Camarote VIP');
    expect(slots[0].seatLabel).toBe('Mesa 4 - Cadeira 1');
    expect(slots[0].customFields).toEqual([
      { name: 'CPF', value: '123.456.789-00' },
      { name: 'Tamanho da Camiseta', value: 'M' },
      { name: 'Restrição Alimentar', value: 'Vegetariano' },
    ]);
  });

  it('registers the ticket types it saw', async () => {
    const types = await prisma.ticketType.findMany({
      where: { eventId },
      orderBy: { name: 'asc' },
      select: { name: true, groupName: true, salePrice: true },
    });

     
    console.info('[ingestion] ticket types:', types);

    expect(types.map((type) => type.name)).toEqual(['Camarote VIP', 'Pista']);
    expect(types.find((type) => type.name === 'Camarote VIP')?.groupName).toBe('Ingressos VIP');
  });

  it('is idempotent, and leaves issued credentials alone', async () => {
    const before = await prisma.eventParticipant.findMany({
      where: { eventId },
      orderBy: { ticketNumber: 'asc' },
      select: { id: true, ticketNumber: true, accessCode: true, qrCodeValue: true, personId: true },
    });

    const service = new SymplaParticipantSyncService(prisma);
    const result = await service.execute({
      eventId,
      organizationId: FIVENTS_ORG_ID,
      symplaEventIdHash: 'stub-hash',
      client: stubClient(bulkOrderTickets()),
      from: null,
    });

     
    console.info('[ingestion] second pass:', result);

    expect(result.errors).toEqual([]);
    expect(result.created).toBe(0);
    expect(result.updated).toBe(3);

    const after = await prisma.eventParticipant.findMany({
      where: { eventId },
      orderBy: { ticketNumber: 'asc' },
      select: { id: true, ticketNumber: true, accessCode: true, qrCodeValue: true, personId: true },
    });

    // No duplicates, same rows, and — the one that would hurt most — the access code a printed
    // badge already carries was not rotated.
    expect(after).toHaveLength(3);
    expect(after).toEqual(before);
  });

  it('reconciles a check-in that happened on Sympla instead of at our gate', async () => {
    const { SymplaReconcileService } = await import(
      '@/core/application/services/sympla/sympla-reconcile.service'
    );
    const { JobQueue } = await import('@/core/infrastructure/jobs');

    // The cancelled ticket in the fixture arrives with checkin.check_in = true, which is exactly
    // the divergence the reconciler exists for: Sympla says they are in, we have no record.
    const before = await prisma.checkIn.count({ where: { eventParticipant: { eventId } } });
    expect(before).toBe(0);

    const service = new SymplaReconcileService(
      prisma,
      new JobQueue(prisma),
      // fullResync is skipped below, so the sync service is never reached.
      null as never,
    );

    const result = await service.reconcileEvent(eventId, { fullResync: false });

     
    console.info('[reconcile] result:', result);

    expect(result.importedFromSympla).toBe(1);

    const imported = await prisma.checkIn.findFirst({
      where: { eventParticipant: { eventId } },
      select: { method: true, checkedInAt: true, totemEventSubscriptionId: true },
    });

     
    console.info('[reconcile] imported check-in:', imported);

    expect(imported?.method).toBe('MANUAL');
    // Sympla's own timestamp, not "now": the earliest check-in is the true one, and inventing a
    // time here would misreport when the attendee actually arrived.
    expect(imported?.checkedInAt.toISOString()).toBe('2026-10-15T12:31:00.000Z');
    // It did not happen at one of our totems, so it must not be attributed to one.
    expect(imported?.totemEventSubscriptionId).toBeNull();

    // Running it again must not double the check-in.
    const second = await service.reconcileEvent(eventId, { fullResync: false });
    expect(second.importedFromSympla).toBe(0);
    expect(await prisma.checkIn.count({ where: { eventParticipant: { eventId } } })).toBe(1);
  });

  it('reports the newest ticket_updated_at as the next watermark', async () => {
    const service = new SymplaParticipantSyncService(prisma);
    const result = await service.execute({
      eventId,
      organizationId: FIVENTS_ORG_ID,
      symplaEventIdHash: 'stub-hash',
      client: stubClient(bulkOrderTickets()),
      from: null,
    });

    // The fixture's latest ticket_updated_at is 2026-09-02 08:00:00, read as UTC.
    expect(result.latestTicketUpdatedAt?.toISOString()).toBe('2026-09-02T08:00:00.000Z');
  });
});
