/**
 * Helpers for Sympla's `custom_form` — the free-form fields each organizer configures on their
 * own purchase form. There is no schema for them and there never will be: the fields differ per
 * event and change between editions. They are stored verbatim on the slot; these helpers only
 * normalize them enough to be rendered and searched.
 */

import type { SymplaCustomFormField } from '@/core/infrastructure/http/sympla/sympla.schemas';

export interface NormalizedCustomField {
  name: string;
  value: string;
}

/** Strips accents so "Restrição" and "restricao" match the same way. */
function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((item) => stringifyValue(item)).filter(Boolean).join(', ');

  return '';
}

export function normalizeCustomForm(fields: SymplaCustomFormField[] | null | undefined): NormalizedCustomField[] {
  if (!fields?.length) return [];

  return fields
    .map((field) => ({ name: field.name?.trim() ?? '', value: stringifyValue(field.value) }))
    .filter((field) => field.name.length > 0);
}

// Sympla has no dedicated document field, so the organizer collects it as a custom question.
// These are the labels that show up in practice; anything else simply leaves the slot without
// a document, which is a supported state.
const DOCUMENT_FIELD_HINTS = ['cpf', 'documento', 'doc', 'rg', 'identidade', 'passaporte', 'passport'];

export function extractDocumentFromCustomForm(fields: NormalizedCustomField[]): string | null {
  for (const field of fields) {
    const key = normalizeKey(field.name);

    if (DOCUMENT_FIELD_HINTS.some((hint) => key === hint || key.includes(hint))) {
      const value = field.value.trim();
      if (value) return value;
    }
  }

  return null;
}

/** Full name from Sympla's split fields, tolerating either half being absent. */
export function buildFullName(firstName?: string | null, lastName?: string | null): string | null {
  const full = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ').trim();

  return full || null;
}
