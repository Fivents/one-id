/**
 * Date parsing for the Sympla API.
 *
 * Sympla mixes formats: some endpoints return ISO-8601 with a Z or an offset, others a naive
 * `YYYY-MM-DD HH:mm:ss` rendered in whatever `timezone` the request asked for (default
 * America/Sao_Paulo).
 *
 * Rather than doing IANA zone maths on the way in — which is where this kind of code usually
 * goes wrong — every request this client makes pins `timezone=UTC`, so a naive string is UTC
 * by construction. The offset-bearing forms are still honoured, because a field that carries
 * its own offset needs no assumption at all.
 */

const NAIVE_DATETIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/;
const HAS_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

export const SYMPLA_REQUEST_TIMEZONE = 'UTC';

/**
 * Returns null for anything unusable — a malformed timestamp must not abort a sync of
 * thousands of tickets, and a null column is honest about what we know.
 */
export function parseSymplaDateTime(value: string | null | undefined): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const normalized = HAS_ZONE.test(trimmed) ? trimmed.replace(' ', 'T') : toUtcIsoString(trimmed);
  if (!normalized) return null;

  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toUtcIsoString(value: string): string | null {
  const match = NAIVE_DATETIME.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;

  return `${year}-${month}-${day}T${hour}:${minute}:${second ?? '00'}Z`;
}

/** Formats a Date for Sympla's `from`/`to` filters, which expect the same naive shape. */
export function formatSymplaDateTime(value: Date): string {
  return value.toISOString().slice(0, 19).replace('T', ' ');
}
