import { describe, expect, it } from 'vitest';

import {
  buildAttendeeSnapshot,
  resolveParticipantDocument,
  resolveParticipantDocumentType,
  resolveParticipantEmail,
  resolveParticipantName,
} from '@/core/utils/participant-identity';

describe('resolveParticipantName', () => {
  it('prefers the linked Person, so editing a Person still flows through', () => {
    expect(
      resolveParticipantName({
        attendeeFullName: 'Nome Antigo',
        person: { name: 'Nome Atualizado' },
      }),
    ).toBe('Nome Atualizado');
  });

  it('falls back to the snapshot when the slot has no identity', () => {
    expect(resolveParticipantName({ attendeeFullName: 'Carlos Mendes', person: null })).toBe('Carlos Mendes');
  });

  it('falls back to the snapshot when the Person name is blank', () => {
    expect(
      resolveParticipantName({ attendeeFullName: 'Carlos Mendes', person: { name: '   ' } }),
    ).toBe('Carlos Mendes');
  });

  it('never returns empty — the badge always needs something to print', () => {
    expect(resolveParticipantName({})).toBe('—');
    expect(resolveParticipantName({ attendeeFullName: '  ' }, 'Convidado')).toBe('Convidado');
  });

  it('trims what it returns', () => {
    expect(resolveParticipantName({ attendeeFullName: '  Joana Ribeiro  ' })).toBe('Joana Ribeiro');
  });
});

describe('resolveParticipantEmail / Document', () => {
  it('returns null rather than an empty string when nothing is known', () => {
    expect(resolveParticipantEmail({})).toBeNull();
    expect(resolveParticipantDocument({})).toBeNull();
  });

  it('reads the snapshot for an identity-less ticket', () => {
    const slot = { attendeeEmail: 'joana@example.com', attendeeDocument: '123.456.789-00', person: null };

    expect(resolveParticipantEmail(slot)).toBe('joana@example.com');
    expect(resolveParticipantDocument(slot)).toBe('123.456.789-00');
  });

  it('prefers the Person when linked', () => {
    const slot = {
      attendeeEmail: 'comprador@example.com',
      person: { email: 'participante@example.com' },
    };

    expect(resolveParticipantEmail(slot)).toBe('participante@example.com');
  });

  it('falls through a Person with no e-mail to the snapshot', () => {
    expect(
      resolveParticipantEmail({ attendeeEmail: 'ticket@example.com', person: { name: 'Sem Email', email: null } }),
    ).toBe('ticket@example.com');
  });

  it('resolves the document type from either source', () => {
    expect(resolveParticipantDocumentType({ attendeeDocumentType: 'ID_CARD' })).toBe('ID_CARD');
    expect(
      resolveParticipantDocumentType({ attendeeDocumentType: 'ID_CARD', person: { documentType: 'PASSPORT' } }),
    ).toBe('PASSPORT');
    expect(resolveParticipantDocumentType({})).toBeNull();
  });
});

describe('buildAttendeeSnapshot', () => {
  it('maps a person onto the slot columns', () => {
    expect(
      buildAttendeeSnapshot({
        name: 'Joana Ribeiro',
        email: 'joana@example.com',
        document: '123.456.789-00',
        documentType: 'OTHER',
      }),
    ).toEqual({
      attendeeFullName: 'Joana Ribeiro',
      attendeeEmail: 'joana@example.com',
      attendeeDocument: '123.456.789-00',
      attendeeDocumentType: 'OTHER',
    });
  });

  it('nulls every column for an absent person instead of leaving them undefined', () => {
    expect(buildAttendeeSnapshot(null)).toEqual({
      attendeeFullName: null,
      attendeeEmail: null,
      attendeeDocument: null,
      attendeeDocumentType: null,
    });
  });
});

describe('bulk purchase', () => {
  it('keeps three tickets distinct even when they share a Person-less e-mail', () => {
    // The Sympla case: one order, three attendees, the buyer's e-mail on all of them.
    const slots = [
      { attendeeFullName: 'Joana Ribeiro', attendeeEmail: 'joana@example.com', person: null },
      { attendeeFullName: 'Carlos Mendes', attendeeEmail: 'joana@example.com', person: null },
      { attendeeFullName: 'Convidado Sem Email', attendeeEmail: null, person: null },
    ];

    expect(slots.map((slot) => resolveParticipantName(slot))).toEqual([
      'Joana Ribeiro',
      'Carlos Mendes',
      'Convidado Sem Email',
    ]);
    expect(resolveParticipantEmail(slots[2])).toBeNull();
  });
});
