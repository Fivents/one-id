/**
 * Whether a gate accepts a given ticket.
 *
 * Pure and shared on purpose: the QR, access-code and face paths must agree exactly on who gets
 * in. Any divergence between them would be a rule that holds at one door and not another, which
 * is the worst kind of bug to debug at an event.
 */

export interface GatePolicy {
  /** Sector names this gate accepts. Null or empty means no restriction. */
  allowedSectors?: string[] | null;
  /** Ticket type names this gate accepts. Null or empty means no restriction. */
  allowedTicketTypes?: string[] | null;
}

export interface GateTicket {
  sectorName?: string | null;
  ticketName?: string | null;
}

export type GateDecision =
  | { allowed: true }
  | { allowed: false; reason: 'SECTOR_NOT_ALLOWED' | 'TICKET_TYPE_NOT_ALLOWED'; value: string | null };

/** Sympla's own casing is inconsistent between the catalogue and the ticket, so compare loosely. */
function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function toList(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) return [];

  return values.map((value) => normalize(String(value))).filter((value) => value.length > 0);
}

/**
 * Reads an allow-list out of a Json column, tolerating whatever shape is actually stored.
 * A malformed value must read as "no restriction" rather than locking everyone out — failing
 * open is correct here, because the alternative is a gate that rejects valid ticket holders
 * because of a bad config write.
 */
export function parseGateAllowList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const list = value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);

  return list.length > 0 ? list : null;
}

export function evaluateGatePolicy(policy: GatePolicy, ticket: GateTicket): GateDecision {
  const sectors = toList(policy.allowedSectors);

  if (sectors.length > 0) {
    const sector = ticket.sectorName?.trim() ?? null;

    // A ticket with no sector cannot satisfy a sector restriction. Letting it through would
    // defeat the restriction entirely, since an unsynced or non-Sympla ticket has no sector.
    if (!sector || !sectors.includes(normalize(sector))) {
      return { allowed: false, reason: 'SECTOR_NOT_ALLOWED', value: sector };
    }
  }

  const ticketTypes = toList(policy.allowedTicketTypes);

  if (ticketTypes.length > 0) {
    const ticketName = ticket.ticketName?.trim() ?? null;

    if (!ticketName || !ticketTypes.includes(normalize(ticketName))) {
      return { allowed: false, reason: 'TICKET_TYPE_NOT_ALLOWED', value: ticketName };
    }
  }

  return { allowed: true };
}

export function hasGateRestriction(policy: GatePolicy): boolean {
  return toList(policy.allowedSectors).length > 0 || toList(policy.allowedTicketTypes).length > 0;
}
