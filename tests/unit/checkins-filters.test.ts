import { describe, expect, it } from 'vitest';

import { buildCheckInWhere, parseCheckInFilters } from '@/app/api/events/[eventId]/checkins/_lib/checkins-filters';

describe('buildCheckInWhere', () => {
  it('keeps participants without a linked Person (Sympla tickets) in scope', () => {
    const where = buildCheckInWhere('ev-1', parseCheckInFilters(new URLSearchParams()));
    expect(where.eventParticipant).toEqual({
      eventId: 'ev-1',
      deletedAt: null,
      OR: [{ personId: null }, { person: { deletedAt: null } }],
    });
  });

  it('searches the ticket snapshot as well as the Person', () => {
    const where = buildCheckInWhere('ev-1', parseCheckInFilters(new URLSearchParams({ search: 'ana' })));
    const fields = (where.OR ?? []).map((clause) => JSON.stringify(clause));
    expect(fields.some((f) => f.includes('"person"') && f.includes('"name"'))).toBe(true);
    expect(fields.some((f) => f.includes('attendeeFullName'))).toBe(true);
    expect(fields.some((f) => f.includes('attendeeEmail'))).toBe(true);
  });

  it('adds no search clause when the search is empty', () => {
    const where = buildCheckInWhere('ev-1', parseCheckInFilters(new URLSearchParams()));
    expect(where).not.toHaveProperty('OR');
  });
});
