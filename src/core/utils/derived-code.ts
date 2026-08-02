import type { CodeProvenance, CodeSourceField } from '@/core/domain/entities/organization-people-settings.entity';

import { generateCheckInCredential } from './checkin-credentials';

export type { CodeProvenance, CodeSourceField };

export interface ResolveDerivedCodeInput {
  explicitValue?: string | null;
  sourceField: CodeSourceField;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  credentialLength: number;
  // accessCode is conventionally stored uppercased; qrCodeValue preserves case. Defaults to true.
  uppercase?: boolean;
}

export interface ResolvedCode {
  value: string;
  provenance: CodeProvenance;
}

export function normalizeDocumentAsAccessCode(document: string | null | undefined): string | null {
  const normalized = document?.trim();
  return normalized ? normalized.toUpperCase() : null;
}

function pickSourceValue(
  sourceField: CodeSourceField,
  input: Pick<ResolveDerivedCodeInput, 'document' | 'phone' | 'email'>,
): string | null {
  switch (sourceField) {
    case 'DOCUMENT':
      return input.document ?? null;
    case 'PHONE':
      return input.phone ?? null;
    case 'EMAIL':
      return input.email ?? null;
    case 'NONE':
      return null;
  }
}

export function resolveDerivedCode(input: ResolveDerivedCodeInput): ResolvedCode {
  const uppercase = input.uppercase ?? true;
  const normalize = (value: string): string => {
    const trimmed = value.trim();
    return uppercase ? trimmed.toUpperCase() : trimmed;
  };

  // An active org/event policy always wins over a manually-typed value — the whole point
  // of the setting is that admins shouldn't have to remember to leave the field blank.
  const sourceValue = pickSourceValue(input.sourceField, input)?.trim();
  if (input.sourceField !== 'NONE' && sourceValue) {
    return { value: normalize(sourceValue), provenance: 'DERIVED' };
  }

  const explicit = input.explicitValue?.trim();
  if (explicit) {
    return { value: normalize(explicit), provenance: 'MANUAL' };
  }

  return { value: generateCheckInCredential(input.credentialLength), provenance: 'RANDOM' };
}

/**
 * Same as resolveDerivedCode, but for DERIVED values (document/phone/email) checks
 * whether the value is already taken by another active record first. Unlike document/email,
 * phone has no uniqueness constraint at the Person level, so two people can legitimately
 * share a phone number — deriving the same code for both would violate the
 * (organization_id, qr_code_value)/(organization_id, access_code) unique constraints.
 * On collision, falls back to RANDOM instead of throwing, so callers stay collision-safe.
 */
export async function resolveDerivedCodeUnique(
  input: ResolveDerivedCodeInput,
  isTaken: (value: string) => Promise<boolean>,
): Promise<ResolvedCode> {
  const resolved = resolveDerivedCode(input);

  if (resolved.provenance !== 'DERIVED') {
    return resolved;
  }

  if (!(await isTaken(resolved.value))) {
    return resolved;
  }

  return { value: generateCheckInCredential(input.credentialLength), provenance: 'RANDOM' };
}
