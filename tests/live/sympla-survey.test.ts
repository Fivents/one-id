/**
 * Surveys every event the token can see, to find real data to validate the ingestion against.
 * Read-only.
 */

import { loadEnvFile } from 'node:process';
import { beforeAll, describe, expect, it } from 'vitest';

import { SymplaHttpClient } from '@/core/infrastructure/http/sympla/sympla-http.client';

let client: SymplaHttpClient;

beforeAll(() => {
  try {
    loadEnvFile('.env');
  } catch {
    /* already loaded */
  }

  const token = process.env.SYMPLA_TEST_TOKEN;
  if (token) client = new SymplaHttpClient({ token, maxRetries: 2 });
});

describe('survey', () => {
  it('counts tickets, orders and presentations per event', async () => {
    expect(client).toBeDefined();

    const page = await client.listEvents({ published: 'all', pageSize: 50 });

    for (const event of page.data) {
      const [participants, orders, presentations] = await Promise.all([
        client.listParticipants(event.id, { cancelledFilter: 'include', pageSize: 100 }),
        client.listOrders(event.id, { cancelledFilter: 'include', pageSize: 100 }),
        client.listPresentations(event.id, { pageSize: 50 }),
      ]);

       
      console.info(
        `[survey] ${event.id} "${event.name}" published=${event.published} ` +
          `participants=${participants.data.length} orders=${orders.data.length} ` +
          `presentations=${presentations.data.length}`,
      );

      if (participants.data.length > 0) {
        const sample = participants.data[0];
         
        console.info('[survey]   sample participant:', {
          id: sample.id,
          name: [sample.first_name, sample.last_name].filter(Boolean).join(' '),
          email: sample.email,
          ticket_number: sample.ticket_number,
          ticket_num_qr_code: sample.ticket_num_qr_code,
          qr_equals_number: sample.ticket_num_qr_code === sample.ticket_number,
          ticket_status: sample.ticket_status,
          ticket_name: sample.ticket_name,
          sector_name: sample.sector_name,
          marked_place_name: sample.marked_place_name,
          order_id: sample.order_id,
          presentation_id: sample.presentation_id,
          ticket_updated_at: sample.ticket_updated_at,
          checkin: sample.checkin,
          custom_form: sample.custom_form,
        });
      }
    }
  });
});
