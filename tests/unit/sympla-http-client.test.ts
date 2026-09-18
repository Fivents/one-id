import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { SymplaApiError } from '@/core/errors';
import { parseRetryAfter, SymplaHttpClient } from '@/core/infrastructure/http/sympla/sympla-http.client';

const FIXTURES = path.resolve(__dirname, '../fixtures/sympla');

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(path.join(FIXTURES, name), 'utf8'));
}

/** First item of a fixture page, as a plain object we can spread to build extra pages. */
function fixtureItem(name: string): Record<string, unknown> {
  const page = fixture(name) as { data: Record<string, unknown>[] };
  return page.data[0];
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

interface HarnessOptions {
  responses: Array<Response | Error>;
  maxRetries?: number;
}

function makeClient({ responses, maxRetries = 3 }: HarnessOptions) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const sleeps: number[] = [];
  const queue = [...responses];

  const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });

    const next = queue.shift();
    if (!next) throw new Error('fetch called more times than the harness has responses');
    if (next instanceof Error) throw next;

    return next;
  }) as unknown as typeof fetch;

  const client = new SymplaHttpClient({
    token: 'super-secret-s-token',
    fetchImpl,
    maxRetries,
    baseDelayMs: 1,
    maxDelayMs: 5,
    random: () => 0,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
  });

  return { client, calls, sleeps };
}

describe('parseRetryAfter', () => {
  it('reads delta-seconds', () => {
    expect(parseRetryAfter('12')).toBe(12_000);
  });

  it('reads an HTTP date', () => {
    const now = Date.parse('2026-09-18T12:00:00Z');
    expect(parseRetryAfter('Fri, 18 Sep 2026 12:00:30 GMT', now)).toBe(30_000);
  });

  it('never returns a negative delay for a past date', () => {
    const now = Date.parse('2026-09-18T12:00:00Z');
    expect(parseRetryAfter('Fri, 18 Sep 2026 11:00:00 GMT', now)).toBe(0);
  });

  it('falls back to null when absent or unparseable', () => {
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter('   ')).toBeNull();
    expect(parseRetryAfter('not-a-date')).toBeNull();
  });
});

describe('SymplaHttpClient — auth and parsing', () => {
  it('sends the token in the s_token header and never in the URL', async () => {
    const { client, calls } = makeClient({ responses: [jsonResponse(fixture('events-page.json'))] });

    await client.listEvents();

    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.s_token).toBe('super-secret-s-token');
    expect(calls[0].url).not.toContain('super-secret-s-token');
  });

  it('parses an events page', async () => {
    const { client } = makeClient({ responses: [jsonResponse(fixture('events-page.json'))] });

    const page = await client.listEvents();

    expect(page.data).toHaveLength(1);
    expect(page.data[0].id).toBe('a1b2c3d4e5f6');
    expect(page.data[0].name).toBe('Tech Summit 2026');
    // cancelled arrives as 0, published as true — both normalize to booleans.
    expect(page.data[0].cancelled).toBe(false);
    expect(page.data[0].published).toBe(true);
    expect(page.data[0].address?.city).toBe('São Paulo');
  });

  it('parses presentations with their sectors', async () => {
    const { client } = makeClient({ responses: [jsonResponse(fixture('presentations-page.json'))] });

    const page = await client.listPresentations('a1b2c3d4e5f6');

    expect(page.data[0].id).toBe(9001);
    expect(page.data[0].sectors).toHaveLength(2);
    expect(page.data[0].sectors?.[1].name).toBe('Camarote VIP');
  });

  it('parses orders with invoice and utm', async () => {
    const { client } = makeClient({ responses: [jsonResponse(fixture('orders-page.json'))] });

    const page = await client.listOrders('a1b2c3d4e5f6');

    expect(page.data[0].id).toBe('ORD-7788');
    expect(page.data[0].invoice_info?.doc_number).toBe('123.456.789-00');
    expect(page.data[0].utm?.utm_campaign).toBe('lancamento');
  });

  it('parses a bulk order where e-mail repeats and one ticket has none', async () => {
    const { client } = makeClient({ responses: [jsonResponse(fixture('participants-bulk-order.json'))] });

    const page = await client.listParticipants('a1b2c3d4e5f6');

    expect(page.data).toHaveLength(3);
    expect(page.data.map((p) => p.ticket_number)).toEqual(['TCK-0001', 'TCK-0002', 'TCK-0003']);
    // Same buyer e-mail on two different attendees — the case that breaks Person uniqueness.
    expect(page.data[0].email).toBe(page.data[1].email);
    expect(page.data[2].email).toBeUndefined();
    expect(page.data[0].custom_form?.[1]).toEqual({ id: 456, name: 'Tamanho da Camiseta', value: 'M' });
    expect(page.data[2].checkin?.check_in).toBe(true);
  });

  it('unwraps a bare check-in response', async () => {
    const { client } = makeClient({
      responses: [jsonResponse({ check_in: true, check_in_date: '2026-10-15T14:30:00Z', check_in_id: 12345 })],
    });

    const result = await client.checkInByTicketNumber('a1b2c3d4e5f6', 'TCK-0001');

    expect(result.check_in).toBe(true);
    expect(result.check_in_id).toBe(12345);
  });
});

describe('SymplaHttpClient — retry and errors', () => {
  it('retries a 429 and honours Retry-After', async () => {
    const { client, sleeps, calls } = makeClient({
      responses: [
        jsonResponse({}, { status: 429, headers: { 'Retry-After': '2' } }),
        jsonResponse(fixture('events-page.json')),
      ],
    });

    const page = await client.listEvents();

    expect(page.data).toHaveLength(1);
    expect(calls).toHaveLength(2);
    // Retry-After says 2s; maxDelayMs caps it at 5ms in this harness.
    expect(sleeps).toEqual([5]);
  });

  it('retries 5xx with exponential backoff', async () => {
    const { client, sleeps } = makeClient({
      responses: [
        jsonResponse({}, { status: 503 }),
        jsonResponse({}, { status: 503 }),
        jsonResponse(fixture('events-page.json')),
      ],
    });

    await client.listEvents();

    expect(sleeps).toEqual([1, 2]);
  });

  it('does not retry a 401 and maps it to a pt-BR message', async () => {
    const { client, calls } = makeClient({
      responses: [jsonResponse(fixture('problem-401.json'), { status: 401 })],
    });

    await expect(client.listEvents()).rejects.toThrowError(SymplaApiError);
    expect(calls).toHaveLength(1);

    await expect(
      makeClient({ responses: [jsonResponse(fixture('problem-401.json'), { status: 401 })] }).client.listEvents(),
    ).rejects.toMatchObject({
      code: 'SYMPLA_UNAUTHORIZED',
      httpStatus: 401,
      retryable: false,
      message: expect.stringContaining('Reconecte'),
    });
  });

  it('appends the upstream detail on a 422 and keeps the violations', async () => {
    const { client } = makeClient({
      responses: [jsonResponse(fixture('problem-422.json'), { status: 422 })],
    });

    await expect(client.checkInByTicketNumber('a1b2c3d4e5f6', 'TCK-0001')).rejects.toMatchObject({
      code: 'SYMPLA_VALIDATION',
      message: expect.stringContaining('O campo ticketNumber é obrigatório.'),
      context: expect.objectContaining({ symplaViolations: [{ field: 'ticketNumber', message: 'must not be blank' }] }),
    });
  });

  it('gives up after maxRetries and reports SYMPLA_UNAVAILABLE', async () => {
    const { client, calls } = makeClient({
      responses: [
        jsonResponse({}, { status: 500 }),
        jsonResponse({}, { status: 500 }),
        jsonResponse({}, { status: 500 }),
      ],
      maxRetries: 2,
    });

    await expect(client.listEvents()).rejects.toMatchObject({ code: 'SYMPLA_UNAVAILABLE' });
    expect(calls).toHaveLength(3);
  });

  it('retries a network failure, then succeeds', async () => {
    const { client, calls } = makeClient({
      responses: [new TypeError('fetch failed'), jsonResponse(fixture('events-page.json'))],
    });

    const page = await client.listEvents();

    expect(page.data).toHaveLength(1);
    expect(calls).toHaveLength(2);
  });

  it('never leaks the token in a thrown error', async () => {
    const { client } = makeClient({
      responses: [jsonResponse(fixture('problem-401.json'), { status: 401 })],
    });

    try {
      await client.listEvents();
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(JSON.stringify((error as SymplaApiError).toJSON())).not.toContain('super-secret-s-token');
    }
  });
});

describe('SymplaHttpClient — cursor pagination', () => {
  it('follows next_cursor until it runs out', async () => {
    const pageOne = {
      data: [{ ...fixtureItem('events-page.json'), id: 'evt-1' }],
      pagination: { has_next: true, quantity: 2, next_cursor: 'cursor-2' },
    };
    const pageTwo = {
      data: [{ ...fixtureItem('events-page.json'), id: 'evt-2' }],
      pagination: { has_next: false, quantity: 2, next_cursor: null },
    };

    const { client, calls } = makeClient({ responses: [jsonResponse(pageOne), jsonResponse(pageTwo)] });

    const ids: string[] = [];
    for await (const event of client.iterateEvents()) {
      ids.push(event.id);
    }

    expect(ids).toEqual(['evt-1', 'evt-2']);
    expect(calls[1].url).toContain('cursor=cursor-2');
  });

  it('stops instead of looping when the upstream repeats a cursor', async () => {
    const repeating = {
      data: [{ ...fixtureItem('events-page.json'), id: 'evt-1' }],
      pagination: { has_next: true, quantity: 99, next_cursor: 'same-cursor' },
    };

    const { client, calls } = makeClient({
      responses: [jsonResponse(repeating), jsonResponse(repeating), jsonResponse(repeating)],
    });

    const ids: string[] = [];
    for await (const event of client.iterateEvents()) {
      ids.push(event.id);
    }

    // First page yields, second repeats the cursor we already followed → stop.
    expect(ids).toEqual(['evt-1', 'evt-1']);
    expect(calls).toHaveLength(2);
  });
});
