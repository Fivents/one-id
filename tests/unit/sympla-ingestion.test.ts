import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  buildFullName,
  extractDocumentFromCustomForm,
  normalizeCustomForm,
} from '@/core/application/services/sympla/sympla-custom-form';
import {
  type PersonLookup,
  resolveTicketIdentity,
} from '@/core/application/services/sympla/sympla-identity-policy';
import {
  symplaCheckInStatusSchema,
  symplaParticipantSchema,
} from '@/core/infrastructure/http/sympla/sympla.schemas';

const FIXTURES = path.resolve(__dirname, '../fixtures/sympla');

function bulkOrderTickets() {
  const page = JSON.parse(readFileSync(path.join(FIXTURES, 'participants-bulk-order.json'), 'utf8')) as {
    data: unknown[];
  };

  return page.data.map((item) => symplaParticipantSchema.parse(item));
}

function lookupOf(people: Array<{ id: string; name: string; email: string }>): PersonLookup {
  return {
    async findActiveByEmail(email) {
      return people
        .filter((person) => person.email.toLowerCase() === email.toLowerCase())
        .map((person) => ({ id: person.id, name: person.name }));
    },
  };
}

describe('normalizeCustomForm', () => {
  it('keeps every field the organizer collected, without a schema', () => {
    const [first] = bulkOrderTickets();

    expect(normalizeCustomForm(first.custom_form)).toEqual([
      { name: 'CPF', value: '123.456.789-00' },
      { name: 'Tamanho da Camiseta', value: 'M' },
      { name: 'Restrição Alimentar', value: 'Vegetariano' },
    ]);
  });

  it('coerces non-string values instead of dropping them', () => {
    expect(
      normalizeCustomForm([
        { name: 'Idade', value: 34 },
        { name: 'Aceita termos', value: true },
        { name: 'Interesses', value: ['IA', 'Infra'] },
      ]),
    ).toEqual([
      { name: 'Idade', value: '34' },
      { name: 'Aceita termos', value: 'true' },
      { name: 'Interesses', value: 'IA, Infra' },
    ]);
  });

  it('drops nameless fields and tolerates an absent form', () => {
    expect(normalizeCustomForm([{ name: '  ', value: 'x' }])).toEqual([]);
    expect(normalizeCustomForm(null)).toEqual([]);
    expect(normalizeCustomForm(undefined)).toEqual([]);
  });
});

describe('extractDocumentFromCustomForm', () => {
  it('finds the document Sympla has no dedicated field for', () => {
    expect(extractDocumentFromCustomForm([{ name: 'CPF', value: '123.456.789-00' }])).toBe('123.456.789-00');
  });

  it('matches the label however the organizer wrote it', () => {
    expect(extractDocumentFromCustomForm([{ name: 'Documento (CPF)', value: '111' }])).toBe('111');
    expect(extractDocumentFromCustomForm([{ name: 'Nº do documento', value: '222' }])).toBe('222');
    expect(extractDocumentFromCustomForm([{ name: 'Passaporte', value: 'AB123' }])).toBe('AB123');
  });

  it('returns null when no field looks like a document', () => {
    expect(extractDocumentFromCustomForm([{ name: 'Tamanho da Camiseta', value: 'M' }])).toBeNull();
    expect(extractDocumentFromCustomForm([{ name: 'CPF', value: '  ' }])).toBeNull();
    expect(extractDocumentFromCustomForm([])).toBeNull();
  });

  it('does not mistake a label that merely contains a hint for a document', () => {
    // Found in real data: a form asking "Cargo" was read as a document because "cargo" contains
    // "rg", so the job title landed in attendeeDocument — which feeds access-code derivation and
    // duplicate detection.
    expect(
      extractDocumentFromCustomForm([
        { name: 'Cargo', value: 'Dev' },
        { name: 'Empresa', value: 'Fivents' },
      ]),
    ).toBeNull();
    expect(extractDocumentFromCustomForm([{ name: 'Encargos', value: 'x' }])).toBeNull();
    expect(extractDocumentFromCustomForm([{ name: 'Doces preferidos', value: 'brigadeiro' }])).toBeNull();
  });

  it('still matches a real document label next to one of those', () => {
    expect(
      extractDocumentFromCustomForm([
        { name: 'Cargo', value: 'Dev' },
        { name: 'RG', value: '12.345.678-9' },
      ]),
    ).toBe('12.345.678-9');
    expect(extractDocumentFromCustomForm([{ name: 'Nº do RG', value: '123' }])).toBe('123');
    expect(extractDocumentFromCustomForm([{ name: 'CPF/CNPJ', value: '000' }])).toBe('000');
  });
});

describe('buildFullName', () => {
  it('joins the split fields', () => {
    expect(buildFullName('Joana', 'Ribeiro')).toBe('Joana Ribeiro');
  });

  it('tolerates either half missing', () => {
    expect(buildFullName('Joana', null)).toBe('Joana');
    expect(buildFullName(null, 'Ribeiro')).toBe('Ribeiro');
    expect(buildFullName(null, null)).toBeNull();
    expect(buildFullName('  ', '  ')).toBeNull();
  });
});

describe('resolveTicketIdentity', () => {
  it('reuses a Person when e-mail and name both match, keeping their face and history', async () => {
    const lookup = lookupOf([{ id: 'p-1', name: 'Joana Ribeiro', email: 'joana@example.com' }]);

    await expect(
      resolveTicketIdentity({ fullName: 'Joana Ribeiro', email: 'joana@example.com' }, lookup),
    ).resolves.toEqual({ kind: 'LINK_EXISTING', personId: 'p-1' });
  });

  it('matches the name case-insensitively', async () => {
    const lookup = lookupOf([{ id: 'p-1', name: 'Joana Ribeiro', email: 'joana@example.com' }]);

    await expect(
      resolveTicketIdentity({ fullName: 'JOANA RIBEIRO', email: 'JOANA@EXAMPLE.COM' }, lookup),
    ).resolves.toEqual({ kind: 'LINK_EXISTING', personId: 'p-1' });
  });

  it('creates a separate identity when the e-mail belongs to someone else', async () => {
    // The bulk-purchase shape: the buyer's address on a different attendee's ticket.
    const lookup = lookupOf([{ id: 'p-1', name: 'Joana Ribeiro', email: 'joana@example.com' }]);

    await expect(
      resolveTicketIdentity({ fullName: 'Carlos Mendes', email: 'joana@example.com' }, lookup),
    ).resolves.toEqual({ kind: 'CREATE', email: 'joana@example.com' });
  });

  it('creates with the e-mail when nobody holds it yet', async () => {
    await expect(
      resolveTicketIdentity({ fullName: 'Nova Pessoa', email: 'nova@example.com' }, lookupOf([])),
    ).resolves.toEqual({ kind: 'CREATE', email: 'nova@example.com' });
  });

  it('creates without an e-mail when the ticket carries none', async () => {
    await expect(
      resolveTicketIdentity({ fullName: 'Convidado', email: null }, lookupOf([])),
    ).resolves.toEqual({ kind: 'CREATE', email: null });
  });
});

describe('bulk order end to end', () => {
  it('gives each of the three tickets its own identity despite one shared e-mail', async () => {
    const tickets = bulkOrderTickets();
    // Start from the buyer already existing, which is the realistic case.
    const people = [{ id: 'p-buyer', name: 'Joana Ribeiro', email: 'joana.ribeiro@example.com' }];

    const resolutions = [];
    for (const ticket of tickets) {
      resolutions.push(
        await resolveTicketIdentity(
          { fullName: buildFullName(ticket.first_name, ticket.last_name), email: ticket.email ?? null },
          lookupOf(people),
        ),
      );
    }

    // Ticket 1 is the buyer herself → reuse. Tickets 2 and 3 are other people → new identities,
    // even though #2 repeats her address and #3 has none.
    expect(resolutions[0]).toEqual({ kind: 'LINK_EXISTING', personId: 'p-buyer' });
    expect(resolutions[1]).toEqual({ kind: 'CREATE', email: 'joana.ribeiro@example.com' });
    expect(resolutions[2]).toEqual({ kind: 'CREATE', email: null });
  });

  it('keeps ticket numbers distinct — the idempotency anchor of the whole sync', () => {
    const tickets = bulkOrderTickets();
    const numbers = tickets.map((ticket) => ticket.ticket_number);

    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('carries the cancelled ticket through instead of dropping it', () => {
    const cancelled = bulkOrderTickets().find((ticket) => ticket.ticket_status === 'C');

    expect(cancelled).toBeDefined();
    expect(cancelled?.ticket_number).toBe('TCK-0003');
  });

  it('reads the document out of the custom form, per ticket', () => {
    const tickets = bulkOrderTickets();
    const documents = tickets.map((ticket) =>
      extractDocumentFromCustomForm(normalizeCustomForm(ticket.custom_form)),
    );

    // The buyer put her own CPF on both paid tickets — exactly the duplication that used to be
    // impossible to store, and the reason the duplicate badge exists in the UI.
    expect(documents).toEqual(['123.456.789-00', '123.456.789-00', null]);
  });
});

describe('check-in status shape', () => {
  it('reads the object form the participant GET returns', () => {
    expect(symplaCheckInStatusSchema.parse({ check_in: false })).toMatchObject({ check_in: false });
  });

  it('reads the array form the check-in POST returns', () => {
    // Measured against the live API: the POST answers with an array, the GET with an object, and
    // neither carries check_in_id despite the documentation saying it does.
    expect(
      symplaCheckInStatusSchema.parse([{ check_in: true, check_in_date: '2026-10-02T16:01:47Z' }]),
    ).toMatchObject({ check_in: true, check_in_date: '2026-10-02T16:01:47Z' });
  });

  it('picks the confirmed entry when the array holds several', () => {
    expect(
      symplaCheckInStatusSchema.parse([{ check_in: false }, { check_in: true, check_in_date: 'x' }]),
    ).toMatchObject({ check_in: true });
  });

  it('survives an empty array instead of throwing mid-sync', () => {
    expect(symplaCheckInStatusSchema.parse([])).toMatchObject({ check_in: null });
  });
});
