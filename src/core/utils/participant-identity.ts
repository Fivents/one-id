/**
 * Resolves the identity to show for an EventParticipant.
 *
 * Since a participant is a ticket slot, it may or may not have a Person attached. Two sources
 * can answer "who is this": the linked Person, and the attendee snapshot stored on the slot.
 *
 * Person wins whenever it is linked. That keeps existing behaviour intact — editing a Person
 * still flows through to their participants — and it stays correct for Sympla, because the
 * ingestion links a slot to a Person only when that Person actually is the attendee. The
 * snapshot is the durable record of what the ticket said, and the only source when the slot
 * has no identity at all.
 */

import type { DocumentType } from '@/core/domain/entities/person.entity';

export interface ParticipantIdentitySource {
  attendeeFullName?: string | null;
  attendeeEmail?: string | null;
  attendeeDocument?: string | null;
  attendeeDocumentType?: DocumentType | null;
  person?: {
    name?: string | null;
    email?: string | null;
    document?: string | null;
    documentType?: DocumentType | null;
  } | null;
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }

  return null;
}

/** Never null: the UI and the badge always need something to print. */
export function resolveParticipantName(source: ParticipantIdentitySource, fallback = '—'): string {
  return firstNonEmpty(source.person?.name, source.attendeeFullName) ?? fallback;
}

export function resolveParticipantEmail(source: ParticipantIdentitySource): string | null {
  return firstNonEmpty(source.person?.email, source.attendeeEmail);
}

export function resolveParticipantDocument(source: ParticipantIdentitySource): string | null {
  return firstNonEmpty(source.person?.document, source.attendeeDocument);
}

export function resolveParticipantDocumentType(source: ParticipantIdentitySource): DocumentType | null {
  return source.person?.documentType ?? source.attendeeDocumentType ?? null;
}

/** Prisma `select` fragment for the Person columns a snapshot is built from. */
export const PERSON_SNAPSHOT_SELECT = {
  name: true,
  email: true,
  document: true,
  documentType: true,
} as const;

export interface PersonSnapshotSource {
  name?: string | null;
  email?: string | null;
  document?: string | null;
  documentType?: DocumentType | null;
}

/**
 * Builds the attendee snapshot written when a slot is created from a known Person.
 *
 * Every creation path fills this in, so a participant can always answer "who is this" on its
 * own. Without that, identity-dependent features (duplicate detection, exports, the badge)
 * would work for Sympla tickets and silently skip manually registered ones, or vice versa.
 */
export function buildAttendeeSnapshot(person: PersonSnapshotSource | null | undefined): {
  attendeeFullName: string | null;
  attendeeEmail: string | null;
  attendeeDocument: string | null;
  attendeeDocumentType: DocumentType | null;
} {
  return {
    attendeeFullName: person?.name ?? null,
    attendeeEmail: person?.email ?? null,
    attendeeDocument: person?.document ?? null,
    attendeeDocumentType: person?.documentType ?? null,
  };
}
