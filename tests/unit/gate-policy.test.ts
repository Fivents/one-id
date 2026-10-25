import { describe, expect, it } from 'vitest';

import {
  evaluateGatePolicy,
  hasGateRestriction,
  parseGateAllowList,
} from '@/core/domain/value-objects/gate-policy';

describe('evaluateGatePolicy', () => {
  it('accepts everything when nothing is restricted', () => {
    expect(evaluateGatePolicy({}, { sectorName: 'Pista', ticketName: 'Inteira' })).toEqual({ allowed: true });
    expect(evaluateGatePolicy({ allowedSectors: null }, {})).toEqual({ allowed: true });
    expect(evaluateGatePolicy({ allowedSectors: [] }, {})).toEqual({ allowed: true });
  });

  it('accepts a ticket whose sector is on the list', () => {
    expect(
      evaluateGatePolicy({ allowedSectors: ['Camarote VIP'] }, { sectorName: 'Camarote VIP' }),
    ).toEqual({ allowed: true });
  });

  it('rejects a ticket from another sector, naming what it found', () => {
    expect(evaluateGatePolicy({ allowedSectors: ['Camarote VIP'] }, { sectorName: 'Pista' })).toEqual({
      allowed: false,
      reason: 'SECTOR_NOT_ALLOWED',
      value: 'Pista',
    });
  });

  it('compares loosely, because Sympla casing differs between catalogue and ticket', () => {
    expect(
      evaluateGatePolicy({ allowedSectors: ['camarote vip'] }, { sectorName: '  Camarote VIP ' }),
    ).toEqual({ allowed: true });
  });

  it('rejects a ticket with no sector when a sector restriction exists', () => {
    // Letting it through would defeat the restriction: an unsynced or non-Sympla ticket has no
    // sector at all, so "no sector" must not be a way past the gate.
    expect(evaluateGatePolicy({ allowedSectors: ['Pista'] }, { sectorName: null })).toEqual({
      allowed: false,
      reason: 'SECTOR_NOT_ALLOWED',
      value: null,
    });
  });

  it('enforces ticket type independently of sector', () => {
    expect(
      evaluateGatePolicy({ allowedTicketTypes: ['Meia-entrada'] }, { ticketName: 'Inteira' }),
    ).toEqual({ allowed: false, reason: 'TICKET_TYPE_NOT_ALLOWED', value: 'Inteira' });
  });

  it('requires both when both are restricted', () => {
    const policy = { allowedSectors: ['Pista'], allowedTicketTypes: ['Inteira'] };

    expect(evaluateGatePolicy(policy, { sectorName: 'Pista', ticketName: 'Inteira' })).toEqual({
      allowed: true,
    });
    expect(evaluateGatePolicy(policy, { sectorName: 'Pista', ticketName: 'Meia' })).toMatchObject({
      allowed: false,
      reason: 'TICKET_TYPE_NOT_ALLOWED',
    });
    expect(evaluateGatePolicy(policy, { sectorName: 'VIP', ticketName: 'Inteira' })).toMatchObject({
      allowed: false,
      reason: 'SECTOR_NOT_ALLOWED',
    });
  });

  it('reports the sector problem first when both fail', () => {
    expect(
      evaluateGatePolicy(
        { allowedSectors: ['Pista'], allowedTicketTypes: ['Inteira'] },
        { sectorName: 'VIP', ticketName: 'Meia' },
      ),
    ).toMatchObject({ reason: 'SECTOR_NOT_ALLOWED' });
  });
});

describe('parseGateAllowList', () => {
  it('reads a well-formed list', () => {
    expect(parseGateAllowList(['Pista', 'VIP'])).toEqual(['Pista', 'VIP']);
  });

  it('fails open on anything malformed, rather than locking the gate', () => {
    // A bad config write must not reject valid ticket holders.
    expect(parseGateAllowList(null)).toBeNull();
    expect(parseGateAllowList(undefined)).toBeNull();
    expect(parseGateAllowList('Pista')).toBeNull();
    expect(parseGateAllowList({ sectors: ['Pista'] })).toBeNull();
    expect(parseGateAllowList([])).toBeNull();
    expect(parseGateAllowList(['  ', ''])).toBeNull();
  });

  it('drops non-string entries but keeps the usable ones', () => {
    expect(parseGateAllowList(['Pista', 42, null, 'VIP'])).toEqual(['Pista', 'VIP']);
  });
});

describe('hasGateRestriction', () => {
  it('is false for an unrestricted gate', () => {
    expect(hasGateRestriction({})).toBe(false);
    expect(hasGateRestriction({ allowedSectors: [], allowedTicketTypes: null })).toBe(false);
  });

  it('is true when either list has entries', () => {
    expect(hasGateRestriction({ allowedSectors: ['Pista'] })).toBe(true);
    expect(hasGateRestriction({ allowedTicketTypes: ['Inteira'] })).toBe(true);
  });
});
