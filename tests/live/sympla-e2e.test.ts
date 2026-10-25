/**
 * End-to-end check against the real Sympla API and the real database.
 *
 * Opt-in (`pnpm test:live`). It goes through the actual use-cases and services rather than raw
 * SQL, so what it proves is the code path the product uses — not a parallel reimplementation.
 *
 * Writes are confined to one clearly marked disposable event in the Fivents organization, so
 * nothing belonging to a real customer is touched.
 */

import { loadEnvFile } from 'node:process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const FIVENTS_ORG_ID = '321831fc-5a4a-471a-9e7e-fe2ab5a92df8';
const TEST_EVENT_SLUG = 'teste-sympla-integracao';
const TEST_EVENT_NAME = '[TESTE SYMPLA] integração';

let prisma: typeof import('@/core/infrastructure/prisma-client').prisma;
let containerService: typeof import('@/core/application/services/container.service').containerService;
let token: string;
let eventId: string;
let symplaEventIdHash: string;

beforeAll(async () => {
  try {
    loadEnvFile('.env');
  } catch {
    /* already loaded */
  }

  token = process.env.SYMPLA_TEST_TOKEN as string;
  expect(token, 'SYMPLA_TEST_TOKEN must be set').toBeTruthy();

  ({ prisma } = await import('@/core/infrastructure/prisma-client'));
  ({ containerService } = await import('@/core/application/services/container.service'));

  const existing = await prisma.event.findFirst({
    where: { organizationId: FIVENTS_ORG_ID, slug: TEST_EVENT_SLUG },
    select: { id: true },
  });

  if (existing) {
    eventId = existing.id;
  } else {
    const created = await prisma.event.create({
      data: {
        name: TEST_EVENT_NAME,
        slug: TEST_EVENT_SLUG,
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
    eventId = created.id;
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Sympla end to end', () => {
  it('connects the organization, storing the token encrypted', async () => {
    const connection = await containerService
      .getSymplaConnectionRepository()
      .upsertByOrganizationId(FIVENTS_ORG_ID, {
        tokenEncrypted: containerService.getSecretCipher().encrypt(token),
      });

    expect(connection.isActive).toBe(true);

    const raw = await prisma.symplaConnection.findUnique({
      where: { organizationId: FIVENTS_ORG_ID },
      select: { tokenEncrypted: true },
    });

    // The credential must be unreadable at rest, and recoverable only through the cipher.
    expect(JSON.stringify(raw?.tokenEncrypted)).not.toContain(token);
    expect(containerService.getSecretCipher().decrypt(connection.tokenEncrypted)).toBe(token);
  });

  it('builds a working client from the stored token', async () => {
    const { client } = await containerService.getSymplaClientProvider().forOrganization(FIVENTS_ORG_ID);
    const page = await client.listEvents({ published: 'all', pageSize: 50 });

    expect(page.data.length).toBeGreaterThan(0);

    const upcoming = page.data.find((event) => event.id === process.env.SYMPLA_TEST_EVENT_ID) ?? page.data.at(-1);
    symplaEventIdHash = upcoming?.id as string;

    expect(symplaEventIdHash).toBeTruthy();
  });

  it('links the event', async () => {
    const link = await containerService.getSymplaEventLinkRepository().link({
      eventId,
      symplaEventIdHash,
    });

    expect(link.eventId).toBe(eventId);

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { symplaLinked: true } });
    expect(event?.symplaLinked).toBe(true);
  });

  it('runs a full sync and mirrors the Sympla event onto ours', async () => {
    const result = await containerService.getSymplaSyncService().syncEvent({ eventId });

     
    console.info('[e2e] sync result:', result);

    expect(result.eventsSynced).toBe(1);
    expect(result.errors).toEqual([]);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true, startsAt: true, endsAt: true, address: true, addressDetails: true },
    });

     
    console.info('[e2e] event after sync:', event);

    // The name came from Sympla, which is the whole point of mirroring.
    expect(event?.name).not.toBe(TEST_EVENT_NAME);
    expect(event?.address).toBeTruthy();
  });

  it('records the sync outcome on the connection', async () => {
    const connection = await containerService.getSymplaConnectionRepository().findByOrganizationId(FIVENTS_ORG_ID);

     
    console.info('[e2e] connection state:', {
      lastSyncStatus: connection?.lastSyncStatus,
      lastSyncAt: connection?.lastSyncAt,
      consecutiveFailures: connection?.consecutiveFailures,
      lastSyncResult: connection?.lastSyncResult,
    });

    expect(connection?.lastSyncStatus).toBe('COMPLETED');
    expect(connection?.consecutiveFailures).toBe(0);
  });

  it('seeds the watermark so the next pass is incremental', async () => {
    const link = await prisma.symplaEventLink.findUnique({
      where: { eventId },
      select: { lastSeedAt: true, symplaUrl: true, hostName: true, publishedOnSympla: true },
    });

     
    console.info('[e2e] link state:', link);

    expect(link?.lastSeedAt).toBeInstanceOf(Date);
  });

  it('writes an audit trail', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { eventId, action: { in: ['SYMPLA_SYNC_COMPLETED', 'SYMPLA_SYNC_FAILED'] } },
      select: { action: true, metadata: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

     
    console.info('[e2e] audit:', logs);

    expect(logs[0]?.action).toBe('SYMPLA_SYNC_COMPLETED');
  });

  it('validates whatever real tickets are synced on the event', async () => {
    const slots = await prisma.eventParticipant.findMany({
      where: { eventId, deletedAt: null, ticketNumber: { not: null } },
      select: {
        ticketNumber: true,
        qrCodeValue: true,
        qrCodeProvenance: true,
        accessCode: true,
        attendeeFullName: true,
        attendeeEmail: true,
        attendeeDocument: true,
        customFields: true,
        personId: true,
        orderId: true,
        ticketStatus: true,
      },
    });

    if (slots.length === 0) {
       
      console.warn('[e2e] no tickets issued on Sympla yet — ticket assertions skipped');
      return;
    }

     
    console.info(`[e2e] ${slots.length} real ticket(s) synced:`, slots);

    for (const slot of slots) {
      // Sympla encodes the QR as the ticket number with its hyphens stripped; this is the
      // relationship the gate relies on, verified against the live API.
      expect(slot.qrCodeValue).toBe(slot.ticketNumber?.replace(/-/g, ''));
      expect(slot.qrCodeProvenance).toBe('MANUAL');

      // Every slot must be independently checkable in, which is what the access code is for.
      expect(slot.accessCode).toBeTruthy();

      // The attendee snapshot is what the gate greets and the badge prints.
      expect(slot.attendeeFullName).toBeTruthy();

      // Orders are synced before participants, so a ticket from an order must be linked to it.
      expect(slot.orderId).toBeTruthy();

      // A job title must never end up in the document field — real data caught this once, when
      // "Cargo" matched because it contains "rg".
      const fields = (slot.customFields ?? []) as Array<{ name: string; value: string }>;
      const jobTitle = fields.find((field) => field.name.toLowerCase() === 'cargo')?.value;
      if (jobTitle) {
        expect(slot.attendeeDocument).not.toBe(jobTitle);
      }
    }

    // Access codes are per ticket and must not collide, however much the attendees repeat.
    const accessCodes = slots.map((slot) => slot.accessCode);
    expect(new Set(accessCodes).size).toBe(accessCodes.length);

    // Ticket numbers are the idempotency anchor.
    const numbers = slots.map((slot) => slot.ticketNumber);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('schedules and drains through the job queue', async () => {
    const scheduled = await containerService.getSymplaSchedulerService().enqueueDueSyncs();

     
    console.info('[e2e] scheduler:', scheduled);

    const { drainJobs } = await import('@/core/infrastructure/jobs');
    const drained = await drainJobs({ queue: containerService.getJobQueue(), maxJobs: 5, budgetMs: 40_000 });

     
    console.info('[e2e] drain:', drained);

    expect(drained.failed).toBe(0);
  });
});
