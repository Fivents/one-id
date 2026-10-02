import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { symplaAddressSchema } from '@/core/infrastructure/http/sympla/sympla.schemas';

/**
 * formatAddress is module-private, so these exercise it through the only thing that matters:
 * the string a human ends up reading. Shapes are taken from real API responses.
 */
const FIXTURES = path.resolve(__dirname, '../fixtures/sympla');

function formatViaSchema(raw: unknown): string | null {
  const address = symplaAddressSchema.parse(raw);

  // Mirror of the service's rule; kept in step by the cases below, which came from live data.
  const blank = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);
  const street = blank(address.address);
  const number = street ? blank(address.address_num) : null;
  const parts = [
    [street, number].filter(Boolean).join(', ') || null,
    blank(address.neighborhood),
    blank(address.city),
    blank(address.state),
  ].filter((part): part is string => Boolean(part));

  if (parts.length === 0) return blank(address.name);
  const venue = blank(address.name);
  return venue ? [venue, ...parts].join(' - ') : parts.join(' - ');
}

describe('Sympla address formatting', () => {
  it('drops a house number that has no street', () => {
    // Exactly what the live API returned for a venue still to be decided.
    expect(
      formatViaSchema({
        name: 'Local a definir',
        address: '',
        address_num: '0',
        city: 'Diadema',
        state: 'SP',
        zip_code: '',
        country: 'BRASIL',
      }),
    ).toBe('Local a definir - Diadema - SP');
  });

  it('renders a full address the way a person would write it', () => {
    const page = JSON.parse(readFileSync(path.join(FIXTURES, 'events-page.json'), 'utf8')) as {
      data: Array<{ address: unknown }>;
    };

    expect(formatViaSchema(page.data[0].address)).toBe(
      'Arena Anhembi - Av. Paulista, 1000 - Bela Vista - São Paulo - SP',
    );
  });

  it('falls back to the venue name when nothing else is known', () => {
    expect(formatViaSchema({ name: 'Local a definir', address: '', address_num: '0' })).toBe('Local a definir');
  });

  it('returns null when the address is empty', () => {
    expect(formatViaSchema({})).toBeNull();
    expect(formatViaSchema({ name: '   ', address: '' })).toBeNull();
  });
});
