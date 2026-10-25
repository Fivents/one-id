/**
 * Exhaustive hunt for any participant data the token can reach.
 *
 * `cancelled_filter: 'include'` is meant to cover everything, but "no participants anywhere" is
 * a strong claim, so this tries every filter value and both the event-wide and per-presentation
 * routes before concluding there is nothing to validate against. Read-only.
 */

import { loadEnvFile } from 'node:process';
import { beforeAll, describe, expect, it } from 'vitest';

import { SymplaHttpClient } from '@/core/infrastructure/http/sympla/sympla-http.client';

let client: SymplaHttpClient;
let token: string;

beforeAll(() => {
  try {
    loadEnvFile('.env');
  } catch {
    /* already loaded */
  }

  token = process.env.SYMPLA_TEST_TOKEN as string;
  if (token) client = new SymplaHttpClient({ token, maxRetries: 2 });
});

describe('deep survey', () => {
  it('tries every cancelled_filter on every event', async () => {
    expect(client).toBeDefined();

    const events = await client.listEvents({ published: 'all', pageSize: 100 });

    for (const event of events.data) {
      const counts: Record<string, number | string> = {};

      for (const filter of ['none', 'include', 'only'] as const) {
        try {
          const page = await client.listParticipants(event.id, { cancelledFilter: filter, pageSize: 200 });
          counts[filter] = page.data.length;
        } catch (error) {
          counts[filter] = `ERRO ${error instanceof Error ? error.message : String(error)}`;
        }
      }

      // No filter at all, in case the default differs from 'none'.
      try {
        const raw = await fetch(
          `https://api.sympla.com.br/public/v1.6.0/events/${event.id}/participants?page_size=200`,
          { headers: { s_token: token, Accept: 'application/json' } },
        );
        const body = (await raw.json()) as { data?: unknown[]; pagination?: { quantity?: number } };
        counts.noFilter = body.data?.length ?? 0;
        counts.reportedQuantity = body.pagination?.quantity ?? 0;
      } catch {
        counts.noFilter = 'ERRO';
      }

       
      console.info(`[deep] ${event.id} "${event.name}" (${event.start_date}) ->`, counts);
    }
  });
});
