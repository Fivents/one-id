import { describe, expect, it } from 'vitest';

import { CountMismatchError, deleteAllMatching } from '@/app/api/_lib/delete-all';
import { buildParticipantsWhere } from '@/app/api/events/[eventId]/participants/_lib/participants-filters';
import { buildPeopleWhere } from '@/app/api/people/_lib/people-filters';

describe('deleteAllMatching', () => {
  it('reports the deleted count when it matches the confirmation', async () => {
    await expect(deleteAllMatching(async () => 42)).resolves.toEqual({ conflict: false, count: 42 });
  });

  it('turns a count mismatch into a conflict instead of a partial delete', async () => {
    const result = await deleteAllMatching(async () => {
      throw new CountMismatchError(43);
    });
    expect(result).toEqual({ conflict: true, actual: 43 });
  });

  it('does not swallow unrelated failures', async () => {
    await expect(
      deleteAllMatching(async () => {
        throw new Error('db down');
      }),
    ).rejects.toThrow('db down');
  });
});

describe('buildPeopleWhere', () => {
  it('scopes to the organization and to active people only', () => {
    expect(buildPeopleWhere({ organizationId: 'org-1' })).toEqual({ organizationId: 'org-1', deletedAt: null });
  });

  it('applies the same search the listing uses, ignoring surrounding spaces', () => {
    const where = buildPeopleWhere({ organizationId: 'org-1', search: '  ana ' });
    expect(where.OR).toHaveLength(4);
    expect(JSON.stringify(where.OR)).toContain('"contains":"ana"');
  });

  it('treats a blank search as no search', () => {
    expect(buildPeopleWhere({ organizationId: 'org-1', search: '   ' })).not.toHaveProperty('OR');
  });
});

describe('buildParticipantsWhere', () => {
  it('scopes to the event and to active participants only', () => {
    expect(buildParticipantsWhere('ev-1')).toEqual({ eventId: 'ev-1', deletedAt: null });
  });

  it('searches the ticket snapshot so personless Sympla tickets are included', () => {
    const where = buildParticipantsWhere('ev-1', { search: 'ana' });
    expect(JSON.stringify(where.OR)).toContain('attendeeFullName');
  });

  it('keeps the optional check-in filter', () => {
    expect(buildParticipantsWhere('ev-1', { checkedIn: true })).toMatchObject({ checkIns: { some: {} } });
    expect(buildParticipantsWhere('ev-1', { checkedIn: false })).toMatchObject({ checkIns: { none: {} } });
  });
});
