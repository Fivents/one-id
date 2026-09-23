/**
 * Last-resort ticket lookup at the gate.
 *
 * A code that matches nothing locally on a Sympla-linked event is most often a ticket bought
 * after the last sync. Asking Sympla directly turns "ingresso não encontrado" into a working
 * check-in, and the ticket is persisted on the way through so the next scan is local again.
 *
 * Known limitation: Sympla's lookup endpoint keys on `ticket_number`, while a scanned QR
 * carries `ticket_num_qr_code` — different fields. So this resolves a ticket only where the
 * scanned value *is* the ticket number (a typed access code, or a QR the organizer encoded
 * that way). Where they differ the call 404s, which costs one bounded request and leaves the
 * caller with the same honest "not found" it already had. Closing that gap needs Sympla's
 * signed QR payload (itemId/signature/timestamp/walletId), which a plain scanner does not
 * produce — so it is a real gap, not an oversight.
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
