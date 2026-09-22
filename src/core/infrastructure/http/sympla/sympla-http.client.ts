/**
 * Sympla public API v1.6.0 client.
 *
 * Responsibilities kept here: auth header, timeouts, retry/backoff, cursor pagination and
 * response validation. Nothing about ONE-ID's domain — mapping lives in the use-cases.
 *
 * The s_token must never reach a log, an error message or an AppError context. Every failure
 * path below goes through SymplaApiError, which only carries the upstream status and the
 * RFC 9457 body.
 */

import { z } from 'zod/v4';

import { SymplaApiError, type SymplaProblemDetails } from '@/core/errors';

import {
  type SymplaCheckInStatus,
  symplaCheckInStatusSchema,
  type SymplaEvent,
  symplaEventSchema,
  type SymplaOrder,
  symplaOrderSchema,
  symplaPageSchema,
  type SymplaPagination,
  type SymplaParticipant,
  symplaParticipantSchema,
  type SymplaPresentation,
  symplaPresentationSchema,
  symplaProblemDetailsSchema,
} from './sympla.schemas';
import { SYMPLA_REQUEST_TIMEZONE } from './sympla-date';

export const SYMPLA_BASE_URL = 'https://api.sympla.com.br/public/v1.6.0';

/** Sympla allows 1-500 for participants and 1-200 elsewhere. */
export const SYMPLA_PARTICIPANT_PAGE_SIZE = 500;
export const SYMPLA_DEFAULT_PAGE_SIZE = 100;

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 4;
const DEFAULT_BASE_DELAY_MS = 500;
const DEFAULT_MAX_DELAY_MS = 30_000;
const JITTER_RATIO = 0.3;

export type CancelledFilter = 'none' | 'include' | 'only';

export interface SymplaPage<T> {
  data: T[];
  pagination: SymplaPagination | null;
}

export interface SymplaHttpClientOptions {
  token: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Injected in tests. */
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

export interface ListEventsParams {
  published?: boolean | 'all';
  from?: string;
  to?: string;
  timezone?: string;
  fieldSort?: 'start_date' | 'end_date' | 'name';
  sort?: 'asc' | 'desc';
  pageSize?: number;
  cursor?: string;
  fields?: string[];
}

export interface ListParticipantsParams {
  from?: string;
  to?: string;
  timezone?: string;
  cancelledFilter?: CancelledFilter;
  participantEmail?: string;
  pageSize?: number;
  cursor?: string;
  fields?: string[];
}

export interface ListOrdersParams {
  from?: string;
  to?: string;
  timezone?: string;
  cancelledFilter?: CancelledFilter;
  buyerEmail?: string;
  pageSize?: number;
  cursor?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 408 and 425 are transient too; everything else 4xx is a client mistake we should not repeat. */
function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

/**
 * Retry-After is either delta-seconds or an HTTP date. Returns null when absent or unparseable
 * so the caller falls back to exponential backoff.
 */
export function parseRetryAfter(header: string | null, now: number = Date.now()): number | null {
  if (!header) return null;

  const trimmed = header.trim();
  if (!trimmed) return null;

  const seconds = Number(trimmed);
  if (Number.isFinite(seconds)) {
    return seconds >= 0 ? seconds * 1000 : null;
  }

  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) return null;

  return Math.max(0, date - now);
}

export class SymplaHttpClient {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly random: () => number;

  constructor(options: SymplaHttpClientOptions) {
    this.token = options.token;
    this.baseUrl = (options.baseUrl ?? SYMPLA_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    this.maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.sleep = options.sleep ?? defaultSleep;
    this.random = options.random ?? Math.random;
  }

  // ── Events ───────────────────────────────────────────────────────

  async listEvents(params: ListEventsParams = {}, signal?: AbortSignal): Promise<SymplaPage<SymplaEvent>> {
    return this.requestPage(symplaEventSchema, '/events', {
      signal,
      query: {
        published: params.published === 'all' ? 'all' : params.published,
        from: params.from,
        to: params.to,
        timezone: params.timezone ?? SYMPLA_REQUEST_TIMEZONE,
        field_sort: params.fieldSort,
        sort: params.sort,
        page_size: params.pageSize ?? SYMPLA_DEFAULT_PAGE_SIZE,
        cursor: params.cursor,
        fields: params.fields?.join(','),
      },
    });
  }

  async getEvent(eventIdHash: string, signal?: AbortSignal): Promise<SymplaEvent> {
    return this.requestSingle(symplaEventSchema, `/events/${encodeURIComponent(eventIdHash)}`, { signal });
  }

  // ── Presentations ────────────────────────────────────────────────

  async listPresentations(
    eventIdHash: string,
    params: { pageSize?: number; cursor?: string } = {},
    signal?: AbortSignal,
  ): Promise<SymplaPage<SymplaPresentation>> {
    return this.requestPage(symplaPresentationSchema, `/events/${encodeURIComponent(eventIdHash)}/presentations`, {
      signal,
      query: { page_size: params.pageSize ?? SYMPLA_DEFAULT_PAGE_SIZE, cursor: params.cursor },
    });
  }

  // ── Orders ───────────────────────────────────────────────────────

  async listOrders(
    eventIdHash: string,
    params: ListOrdersParams = {},
    signal?: AbortSignal,
  ): Promise<SymplaPage<SymplaOrder>> {
    return this.requestPage(symplaOrderSchema, `/events/${encodeURIComponent(eventIdHash)}/orders`, {
      signal,
      query: {
        from: params.from,
        to: params.to,
        timezone: params.timezone ?? SYMPLA_REQUEST_TIMEZONE,
        cancelled_filter: params.cancelledFilter,
        buyer_email: params.buyerEmail,
        page_size: params.pageSize ?? SYMPLA_DEFAULT_PAGE_SIZE,
        cursor: params.cursor,
      },
    });
  }

  async getOrder(eventIdHash: string, orderSk: string, signal?: AbortSignal): Promise<SymplaOrder> {
    return this.requestSingle(
      symplaOrderSchema,
      `/events/${encodeURIComponent(eventIdHash)}/orders/${encodeURIComponent(orderSk)}`,
      { signal },
    );
  }

  // ── Participants ─────────────────────────────────────────────────

  async listParticipants(
    eventIdHash: string,
    params: ListParticipantsParams = {},
    signal?: AbortSignal,
  ): Promise<SymplaPage<SymplaParticipant>> {
    return this.requestPage(symplaParticipantSchema, `/events/${encodeURIComponent(eventIdHash)}/participants`, {
      signal,
      query: {
        from: params.from,
        to: params.to,
        timezone: params.timezone ?? SYMPLA_REQUEST_TIMEZONE,
        cancelled_filter: params.cancelledFilter,
        participant_email: params.participantEmail,
        page_size: params.pageSize ?? SYMPLA_PARTICIPANT_PAGE_SIZE,
        cursor: params.cursor,
        fields: params.fields?.join(','),
      },
    });
  }

  async getParticipant(eventIdHash: string, participantId: string, signal?: AbortSignal): Promise<SymplaParticipant> {
    return this.requestSingle(
      symplaParticipantSchema,
      `/events/${encodeURIComponent(eventIdHash)}/participants/${encodeURIComponent(participantId)}`,
      { signal },
    );
  }

  async getParticipantByTicketNumber(
    eventIdHash: string,
    ticketNumber: string,
    signal?: AbortSignal,
  ): Promise<SymplaParticipant> {
    return this.requestSingle(
      symplaParticipantSchema,
      `/events/${encodeURIComponent(eventIdHash)}/participants/ticketNumber/${encodeURIComponent(ticketNumber)}`,
      { signal },
    );
  }

  // ── Check-in (write) ─────────────────────────────────────────────

  async checkInByParticipantId(
    eventIdHash: string,
    participantId: string,
    signal?: AbortSignal,
  ): Promise<SymplaCheckInStatus> {
    return this.requestSingle(
      symplaCheckInStatusSchema,
      `/events/${encodeURIComponent(eventIdHash)}/participants/${encodeURIComponent(participantId)}/check-in`,
      { method: 'POST', signal },
    );
  }

  async checkInByTicketNumber(
    eventIdHash: string,
    ticketNumber: string,
    signal?: AbortSignal,
  ): Promise<SymplaCheckInStatus> {
    return this.requestSingle(
      symplaCheckInStatusSchema,
      `/events/${encodeURIComponent(eventIdHash)}/participants/ticketNumber/${encodeURIComponent(ticketNumber)}/check-in`,
      { method: 'POST', signal },
    );
  }

  // ── Cursor iteration ─────────────────────────────────────────────

  async *iterateEvents(params: ListEventsParams = {}, signal?: AbortSignal): AsyncGenerator<SymplaEvent> {
    yield* this.paginate((cursor) => this.listEvents({ ...params, cursor }, signal));
  }

  async *iteratePresentations(
    eventIdHash: string,
    params: { pageSize?: number } = {},
    signal?: AbortSignal,
  ): AsyncGenerator<SymplaPresentation> {
    yield* this.paginate((cursor) => this.listPresentations(eventIdHash, { ...params, cursor }, signal));
  }

  async *iterateOrders(
    eventIdHash: string,
    params: ListOrdersParams = {},
    signal?: AbortSignal,
  ): AsyncGenerator<SymplaOrder> {
    yield* this.paginate((cursor) => this.listOrders(eventIdHash, { ...params, cursor }, signal));
  }

  async *iterateParticipants(
    eventIdHash: string,
    params: ListParticipantsParams = {},
    signal?: AbortSignal,
  ): AsyncGenerator<SymplaParticipant> {
    yield* this.paginate((cursor) => this.listParticipants(eventIdHash, { ...params, cursor }, signal));
  }

  private async *paginate<T>(fetchPage: (cursor?: string) => Promise<SymplaPage<T>>): AsyncGenerator<T> {
    let cursor: string | undefined;
    const seenCursors = new Set<string>();

    for (;;) {
      const page = await fetchPage(cursor);

      for (const item of page.data) {
        yield item;
      }

      const next = page.pagination?.next_cursor ?? null;

      // An empty page, a missing cursor, or a cursor we already followed all mean "done".
      // The seen-set is the guard against an upstream bug pinning us in an infinite loop.
      if (!next || page.data.length === 0 || seenCursors.has(next)) {
        return;
      }

      seenCursors.add(next);
      cursor = next;
    }
  }

  // ── Transport ────────────────────────────────────────────────────

  private async requestPage<T extends z.ZodTypeAny>(
    itemSchema: T,
    path: string,
    options: RequestOptions,
  ): Promise<SymplaPage<z.infer<T>>> {
    const payload = await this.request(path, options);
    const parsed = symplaPageSchema(itemSchema).parse(payload);

    return { data: parsed.data ?? [], pagination: parsed.pagination ?? null };
  }

  private async requestSingle<T extends z.ZodTypeAny>(
    itemSchema: T,
    path: string,
    options: RequestOptions,
  ): Promise<z.infer<T>> {
    const payload = await this.request(path, options);

    // Sympla wraps single resources in `data` on most endpoints but returns the check-in
    // result bare. Unwrap when the envelope is there rather than branching per endpoint.
    const unwrapped =
      typeof payload === 'object' && payload !== null && 'data' in payload
        ? (payload as { data: unknown }).data
        : payload;

    return itemSchema.parse(unwrapped) as z.infer<T>;
  }

  private buildUrl(path: string, query?: RequestOptions['query']): string {
    const url = new URL(`${this.baseUrl}${path}`);

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }

    return url.toString();
  }

  private computeDelayMs(attempt: number, retryAfterMs: number | null): number {
    if (retryAfterMs !== null) {
      return Math.min(retryAfterMs, this.maxDelayMs);
    }

    const exponential = Math.min(this.baseDelayMs * 2 ** attempt, this.maxDelayMs);
    const jitter = exponential * JITTER_RATIO * this.random();

    return Math.min(exponential + jitter, this.maxDelayMs);
  }

  private async parseProblem(response: Response): Promise<SymplaProblemDetails | undefined> {
    try {
      const body: unknown = await response.json();
      const parsed = symplaProblemDetailsSchema.safeParse(body);

      if (!parsed.success) return undefined;

      return {
        type: parsed.data.type ?? undefined,
        title: parsed.data.title ?? undefined,
        status: parsed.data.status ?? undefined,
        detail: parsed.data.detail ?? undefined,
        violations: parsed.data.violations?.map((violation) => ({
          field: violation.field ?? undefined,
          message: violation.message ?? undefined,
        })),
      };
    } catch {
      // A non-JSON error body tells us nothing beyond the status, which the caller already has.
      return undefined;
    }
  }

  private async request(path: string, options: RequestOptions): Promise<unknown> {
    const url = this.buildUrl(path, options.query);
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), this.timeoutMs);

      const signal = options.signal
        ? AbortSignal.any([options.signal, timeoutController.signal])
        : timeoutController.signal;

      try {
        const response = await this.fetchImpl(url, {
          method: options.method ?? 'GET',
          headers: {
            s_token: this.token,
            Accept: 'application/json',
            ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
          },
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal,
          cache: 'no-store',
        });

        if (response.ok) {
          // 204 has no body; the callers that hit it validate against a nullish-tolerant schema.
          if (response.status === 204) return null;
          return await response.json();
        }

        const problem = await this.parseProblem(response);
        const error = new SymplaApiError(response.status, problem, { path });

        if (!isRetryableStatus(response.status) || attempt === this.maxRetries) {
          throw error;
        }

        lastError = error;
        await this.sleep(this.computeDelayMs(attempt, parseRetryAfter(response.headers.get('Retry-After'))));
        continue;
      } catch (error) {
        if (error instanceof SymplaApiError) throw error;

        // The caller cancelled — never retry, and never disguise it as a Sympla failure.
        if (options.signal?.aborted) throw error;

        if (attempt === this.maxRetries) {
          lastError = error;
          break;
        }

        lastError = error;
        await this.sleep(this.computeDelayMs(attempt, null));
        continue;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // Network failure or our own timeout, exhausted. 0 maps to SYMPLA_UNAVAILABLE.
    throw new SymplaApiError(0, undefined, {
      path,
      cause: lastError instanceof Error ? lastError.name : 'UNKNOWN',
    });
  }
}
