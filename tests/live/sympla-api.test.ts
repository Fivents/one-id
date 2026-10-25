/**
 * Live contract check against the real Sympla API.
 *
 * Opt-in: `pnpm test:live`, with SYMPLA_TEST_TOKEN in .env. The point is not to assert business
 * behaviour — the unit suite does that against fixtures — but to find out where the real payload
 * disagrees with the schemas those fixtures encode. Every assertion here is read-only; nothing
 * in this file writes to Sympla.
 */

import { loadEnvFile } from 'node:process';
import { beforeAll, describe, expect, it } from 'vitest';

import { SymplaApiError } from '@/core/errors';
import type { SymplaEvent } from '@/core/infrastructure/http/sympla/sympla.schemas';
import { parseSymplaDateTime } from '@/core/infrastructure/http/sympla/sympla-date';
import { SymplaHttpClient } from '@/core/infrastructure/http/sympla/sympla-http.client';

let client: SymplaHttpClient;
let token: string | undefined;

beforeAll(() => {
  try {
    loadEnvFile('.env');
  } catch {
    // Already loaded, or no file — the token check below reports it either way.
  }

  token = process.env.SYMPLA_TEST_TOKEN;

  if (token) {
    client = new SymplaHttpClient({ token, maxRetries: 2 });
  }
});

describe('Sympla live API', () => {
  it('has a token configured', () => {
    expect(token, 'set SYMPLA_TEST_TOKEN in .env to run the live checks').toBeTruthy();
  });

  it('authenticates and lists events', async () => {
    const page = await client.listEvents({ published: 'all', pageSize: 50 });

     
    console.info(
      `[live] ${page.data.length} event(s) visible to this token:`,
      page.data.map((event) => ({
        id: event.id,
        name: event.name,
        published: event.published,
        cancelled: event.cancelled,
        start: event.start_date,
      })),
    );

    expect(Array.isArray(page.data)).toBe(true);
  });

  it('rejects a bad token with a mapped error', async () => {
    const bad = new SymplaHttpClient({ token: 'definitely-not-a-valid-token', maxRetries: 0 });

    await expect(bad.listEvents({ pageSize: 1 })).rejects.toThrowError(SymplaApiError);
  });

  describe('for the event under test', () => {
    let event: SymplaEvent | undefined;

    beforeAll(async () => {
      if (!token) return;
      const page = await client.listEvents({ published: 'all', pageSize: 50 });

      // SYMPLA_TEST_EVENT_ID pins a specific event; otherwise take the one starting soonest from
      // now, which is the one a tester just created.
      const pinned = process.env.SYMPLA_TEST_EVENT_ID;
      if (pinned) {
        event = page.data.find((candidate) => candidate.id === pinned);
        expect(event, `event ${pinned} is not visible to this token`).toBeTruthy();
        return;
      }

      const now = Date.now();
      event = [...page.data]
        .filter((candidate) => {
          const start = parseSymplaDateTime(candidate.start_date);
          return start !== null && start.getTime() >= now;
        })
        .sort((a, b) => {
          const left = parseSymplaDateTime(a.start_date)?.getTime() ?? 0;
          const right = parseSymplaDateTime(b.start_date)?.getTime() ?? 0;
          return left - right;
        })[0];

       
      console.info('[live] event under test:', event ? { id: event.id, name: event.name } : '(none upcoming)');
    });

    it('parses the event detail', async () => {
      if (!event) {
         
        console.warn('[live] no events visible to this token yet — skipping detail checks');
        return;
      }

      const detail = await client.getEvent(event.id);

       
      console.info('[live] event detail:', {
        id: detail.id,
        name: detail.name,
        published: detail.published,
        cancelled: detail.cancelled,
        start_date: detail.start_date,
        end_date: detail.end_date,
        address: detail.address?.city ?? null,
        host: detail.host?.name ?? null,
      });

      expect(detail.id).toBe(event.id);
      // Whatever shape the dates arrive in, the parser must cope.
      if (detail.start_date) {
        expect(parseSymplaDateTime(detail.start_date)).toBeInstanceOf(Date);
      }
    });

    it('parses presentations and their sectors', async () => {
      if (!event) return;

      const page = await client.listPresentations(event.id, { pageSize: 50 });

       
      console.info(
        `[live] ${page.data.length} presentation(s):`,
        page.data.map((presentation) => ({
          id: presentation.id,
          start: presentation.start_date,
          start_utc: presentation.start_date_utc,
          sectors: presentation.sectors?.map((sector) => sector.name) ?? [],
        })),
      );

      expect(Array.isArray(page.data)).toBe(true);
    });

    it('parses orders', async () => {
      if (!event) return;

      const page = await client.listOrders(event.id, { cancelledFilter: 'include', pageSize: 50 });

       
      console.info(
        `[live] ${page.data.length} order(s):`,
        page.data.map((order) => ({
          id: order.id,
          status: order.order_status,
          buyer: order.buyer_email,
          total: order.order_total_sale_price,
          discount: order.discount_code,
          utm: order.utm?.utm_source ?? null,
        })),
      );

      expect(Array.isArray(page.data)).toBe(true);
    });

    it('parses participants, including the fields the ingestion depends on', async () => {
      if (!event) return;

      const page = await client.listParticipants(event.id, { cancelledFilter: 'include', pageSize: 100 });

       
      console.info(
        `[live] ${page.data.length} participant(s):`,
        page.data.map((participant) => ({
          id: participant.id,
          name: [participant.first_name, participant.last_name].filter(Boolean).join(' '),
          email: participant.email,
          ticket_number: participant.ticket_number,
          ticket_num_qr_code: participant.ticket_num_qr_code,
          // The ingestion's two load-bearing questions: do these differ, and is the QR present?
          qr_equals_number: participant.ticket_num_qr_code === participant.ticket_number,
          ticket_status: participant.ticket_status,
          ticket_name: participant.ticket_name,
          sector: participant.sector_name,
          seat: participant.marked_place_name,
          checked_in: participant.checkin?.check_in ?? null,
          updated_at: participant.ticket_updated_at,
          custom_form: participant.custom_form?.map((field) => field.name) ?? [],
        })),
      );

      expect(Array.isArray(page.data)).toBe(true);

      for (const participant of page.data) {
        // The idempotency anchor must exist on every row, or the upsert has nothing to key on.
        expect(participant.ticket_number, 'every participant must carry a ticket_number').toBeTruthy();
      }
    });
  });
});
