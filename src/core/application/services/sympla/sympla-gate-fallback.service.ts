/**
 * Last-resort ticket lookup at the gate.
 *
 * A code that matches nothing locally on a Sympla-linked event is most often a ticket bought
 * after the last sync. Asking Sympla directly turns "ingresso não encontrado" into a working
 * check-in, and the ticket is persisted on the way through so the next scan is local again.
 *
 * Known limitation, now measured rather than assumed: Sympla's lookup endpoint keys on
 * `ticket_number` and accepts nothing else. A real ticket "UVKL-LL-QDAT" encodes its QR as
 * "UVKLLLQDAT" — the same string without hyphens — and that form returns 404 from this endpoint.
 * So a scanned QR for a ticket we have never synced cannot be resolved here; a typed access code
 * or ticket number can. The failed call costs one bounded request and leaves the caller with the
 * same honest "not found" it already had.
 *
 * The gap that mattered in practice was different and is closed elsewhere: a ticket we *have*
 * synced whose `ticket_num_qr_code` never came down got a generated QR, so the attendee's real QR
 * matched nothing. The check-in route now also compares the scan against the hyphen-stripped
 * ticket number, which needs no API call at all.
 */

import { Logger } from '@/core/utils/logger';
import type { PrismaClient } from '@/generated/prisma/client';

import type { SymplaClientProvider } from '../sympla-client.provider';

import type { SymplaParticipantSyncService } from './sympla-participant-sync.service';

/**
 * The attendee is standing at the door. A slow answer is worse than a local "not found", so
 * the whole detour is bounded well under the totem's own patience.
 */
const GATE_LOOKUP_TIMEOUT_MS = 3_000;

export class SymplaGateFallbackService {
  constructor(
    private readonly db: PrismaClient,
    private readonly clientProvider: SymplaClientProvider,
    private readonly participantSync: SymplaParticipantSyncService,
  ) {}

  /** Returns the id of a newly persisted participant slot, or null if there is nothing to find. */
  async resolveByTicketNumber(eventId: string, ticketNumber: string): Promise<string | null> {
    const trimmed = ticketNumber.trim();
    if (!trimmed) return null;

    try {
      const event = await this.db.event.findUnique({
        where: { id: eventId },
        select: {
          organizationId: true,
          symplaEventLink: { select: { symplaEventIdHash: true } },
        },
      });

      const symplaEventIdHash = event?.symplaEventLink?.symplaEventIdHash;
      if (!event || !symplaEventIdHash) return null;

      const { client } = await this.clientProvider.forOrganization(event.organizationId, {
        timeoutMs: GATE_LOOKUP_TIMEOUT_MS,
        // No retries here: the queue exists for persistence, the gate exists for speed.
        maxRetries: 0,
      });

      return await this.participantSync.syncSingleTicket({
        eventId,
        organizationId: event.organizationId,
        symplaEventIdHash,
        ticketNumber: trimmed,
        client,
      });
    } catch (error) {
      // Any failure here simply means the credential stays unrecognised; the caller already
      // has a correct answer for that, and it must not become a 500 at the door.
      Logger.warn('Sympla gate fallback lookup failed', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  }
}
