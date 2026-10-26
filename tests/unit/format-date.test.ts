import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatDateTimeRange, formatShortDateTime } from '@/lib/utils/format-date';

// Local-time constructors keep these tests independent of the machine's timezone.
const at = (year: number, month: number, day: number, hour = 0, minute = 0) =>
  new Date(year, month - 1, day, hour, minute);

describe('formatShortDateTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(at(2026, 10, 25, 12));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('omits the year and seconds for dates in the current year', () => {
    const label = formatShortDateTime(at(2026, 10, 25, 17, 3), 'pt-BR');
    expect(label).toContain('25');
    expect(label).toContain('17:03');
    expect(label).not.toContain('2026');
    expect(label).not.toMatch(/17:03:\d{2}/);
  });

  it('shows the year when the date falls in another year', () => {
    expect(formatShortDateTime(at(2025, 9, 15, 20, 0), 'pt-BR')).toContain('2025');
  });
});

describe('formatDateTimeRange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(at(2026, 10, 25, 12));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('collapses the end to a time when both ends are on the same day', () => {
    const label = formatDateTimeRange(at(2026, 10, 15, 20, 0), at(2026, 10, 15, 23, 30), 'pt-BR');
    const [, end] = label.split(' – ');
    expect(end).toBe('23:30');
  });

  it('keeps the full end date when the range crosses midnight', () => {
    const label = formatDateTimeRange(at(2026, 10, 25, 17, 0), at(2026, 10, 26, 2, 0), 'pt-BR');
    const [start, end] = label.split(' – ');
    expect(start).toContain('25');
    expect(end).toContain('26');
    expect(end).toContain('02:00');
  });

  it('accepts ISO strings as returned by the API', () => {
    const label = formatDateTimeRange(at(2026, 11, 1, 9).toISOString(), at(2026, 11, 1, 18).toISOString(), 'pt-BR');
    expect(label.split(' – ')).toHaveLength(2);
  });
});
