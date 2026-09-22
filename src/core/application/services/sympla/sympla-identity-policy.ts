/**
 * Decides which Person, if any, a Sympla ticket should attach to.
 *
 * The hard case is the bulk purchase: one order, N tickets, N different attendees — and the
 * buyer routinely puts their own e-mail on every one of them, or leaves it blank. Attaching all
 * N to a single Person would make the totem greet three different people by the buyer's name,
 * so a repeated e-mail must produce separate identities.
 *
 * Order of preference:
 *  1. e-mail AND name both match an active Person in the organization — that really is them,
 *     and reusing the Person keeps their registered face and cross-event history.
 *  2. e-mail present and not yet used by any Person in the organization — create one with it.
 *  3. otherwise — create a Person of this ticket's own, with no e-mail if need be. Duplicate
 *     e-mails and documents are expected here; P1a removed the constraints that forbade them.
 */

import type { Prisma } from '@/generated/prisma/client';

export type IdentityResolution =
  | { kind: 'LINK_EXISTING'; personId: string }
  | { kind: 'CREATE'; email: string | null };

export interface IdentityCandidate {
  fullName: string | null;
  email: string | null;
}

export interface PersonLookup {
  findActiveByEmail(email: string): Promise<Array<{ id: string; name: string }>>;
}

function sameName(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;

  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export async function resolveTicketIdentity(
  candidate: IdentityCandidate,
  lookup: PersonLookup,
): Promise<IdentityResolution> {
  const email = candidate.email?.trim().toLowerCase() || null;

  if (!email) {
    return { kind: 'CREATE', email: null };
  }

  const existing = await lookup.findActiveByEmail(email);

  if (existing.length === 0) {
    return { kind: 'CREATE', email };
  }

  const sameHuman = existing.find((person) => sameName(person.name, candidate.fullName));
  if (sameHuman) {
    return { kind: 'LINK_EXISTING', personId: sameHuman.id };
  }

  // The e-mail is taken by someone with a different name — the classic bulk-purchase shape.
  // This attendee gets an identity of their own, sharing the address.
  return { kind: 'CREATE', email };
}

export function makePersonLookup(
  tx: Prisma.TransactionClient,
  organizationId: string,
): PersonLookup {
  return {
    async findActiveByEmail(email) {
      return tx.person.findMany({
        where: { organizationId, deletedAt: null, email: { equals: email, mode: 'insensitive' } },
        select: { id: true, name: true },
        take: 20,
      });
    },
  };
}
