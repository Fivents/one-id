import { describe, expect, it } from 'vitest';

import { formatSymplaDateTime, parseSymplaDateTime } from '@/core/infrastructure/http/sympla/sympla-date';

describe('parseSymplaDateTime', () => {
  it('treats a naive timestamp as UTC, because every request pins timezone=UTC', () => {
    expect(parseSymplaDateTime('2026-10-15 09:00:00')?.toISOString()).toBe('2026-10-15T09:00:00.000Z');
  });

  it('accepts the T separator too', () => {
    expect(parseSymplaDateTime('2026-10-15T09:00:00')?.toISOString()).toBe('2026-10-15T09:00:00.000Z');
  });

  it('honours an explicit Z', () => {
    expect(parseSymplaDateTime('2026-10-15T12:00:00Z')?.toISOString()).toBe('2026-10-15T12:00:00.000Z');
  });

  it('honours an explicit offset instead of assuming UTC', () => {
    // 09:00 at -03:00 is 12:00 UTC — silently dropping the offset would shift it 3 hours.
    expect(parseSymplaDateTime('2026-10-15T09:00:00-03:00')?.toISOString()).toBe('2026-10-15T12:00:00.000Z');
  });

  it('defaults missing seconds to zero', () => {
    expect(parseSymplaDateTime('2026-10-15 09:00')?.toISOString()).toBe('2026-10-15T09:00:00.000Z');
  });

  it('drops sub-second precision rather than failing on it', () => {
    expect(parseSymplaDateTime('2026-10-15 09:00:00.123')?.toISOString()).toBe('2026-10-15T09:00:00.000Z');
  });

  it('returns null for anything unusable, so one bad row cannot abort a sync', () => {
    expect(parseSymplaDateTime(null)).toBeNull();
    expect(parseSymplaDateTime(undefined)).toBeNull();
    expect(parseSymplaDateTime('')).toBeNull();
    expect(parseSymplaDateTime('   ')).toBeNull();
    expect(parseSymplaDateTime('not a date')).toBeNull();
    expect(parseSymplaDateTime('15/10/2026')).toBeNull();
  });

  it('rejects an impossible date instead of rolling it over', () => {
    expect(parseSymplaDateTime('2026-13-45 99:00:00')).toBeNull();
  });
});

describe('formatSymplaDateTime', () => {
  it('renders the naive shape Sympla filters expect', () => {
    expect(formatSymplaDateTime(new Date('2026-10-15T09:30:15.500Z'))).toBe('2026-10-15 09:30:15');
  });

  it('round-trips through the parser', () => {
    const original = new Date('2026-10-15T09:30:15.000Z');
    expect(parseSymplaDateTime(formatSymplaDateTime(original))?.toISOString()).toBe(original.toISOString());
  });
});
