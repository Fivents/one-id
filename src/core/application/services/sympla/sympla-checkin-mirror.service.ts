/**
 * Pushes a ONE-ID check-in back to Sympla, so the organizer's own dashboard and app see the
 * same gate state we do.
 *
 * Runs as a queued job rather than inline: the gate must not wait on a third party, and a
 * network blip at the door must not cost a check-in.
 */

import { SymplaApiError } from '@/core/errors';
import type { SymplaHttpClient } from '@/core/infrastructure/http/sympla/sympla-http.client';
import { Logger } from '@/core/utils/logger';
import type { PrismaClient } from '@/generated/prisma/client';

import type { SymplaClientProvider } from '../sympla-client.provider';

export type MirrorOutcome =
  | 'MIRRORED'
  | 'ALREADY_MIRRORED'
  | 'NOT_A_SYMPLA_TICKET'
  | 'REJECTED_BY_SYMPLA'
  | 'CHECK_IN_GONE';

export class SymplaCheckInMirrorService {
  constructor(
    private readonly db: PrismaClient,
    private readonly clientProvider: SymplaClientProvider,
  ) {}

  async mirror(checkInId: string): Promise<MirrorOutcome> {
    const checkIn = await this.db.checkIn.findUnique({
      where: { id: checkInId },
      select: {
        id: true,
        checkedInAt: true,
        eventParticipant: {
          select: {
            id: true,
            symplaParticipantId: true,
            ticketNumber: true,
            symplaCheckedIn: true,
            eventId: true,
            event: {
              select: {
                organizationId: true,
                symplaEventLink: { select: { symplaEventIdHash: true } },
              },
            },
          },
        },
      },
    });

    // The check-in was invalidated between enqueue and run. Nothing to mirror, nothing wrong.
    if (!checkIn) return 'CHECK_IN_GONE';

    const participant = checkIn.eventParticipant;
    const symplaEventIdHash = participant.event.symplaEventLink?.symplaEventIdHash;

    // A manually created participant on a linked event, or an unlinked event: not ours to push.
    if (!symplaEventIdHash || (!participant.symplaParticipantId && !participant.ticketNumber)) {
      return 'NOT_A_SYMPLA_TICKET';
    }

    // Sympla already has it — either we mirrored it before, or the organizer used their own
    // app at another gate. Either way this job is done.
    if (participant.symplaCheckedIn) return 'ALREADY_MIRRORED';

    const { client } = await this.clientProvider.forOrganization(participant.event.organizationId);

    try {
      const result = await this.postCheckIn(client, symplaEventIdHash, participant);

      // Only claim it was mirrored when Sympla actually says so. Assuming success from a 2xx
      // would be worse than failing: the reconciler compares this flag to decide whether the two
      // sides agree, so a false positive makes a real divergence permanently invisible.
      //
      // Observed against the live API: the POST sometimes answers 2xx without echoing the
      // confirmation even though the check-in did register. Throwing rather than returning hands
      // it to the queue's backoff, and the retry gets a definitive answer either way — a second
      // success, or 400 already_performed, which the catch below reads as the goal state. That
      // converges in seconds instead of waiting for the daily reconciliation.
      if (result.check_in !== true) {
        Logger.warn('Sympla accepted the check-in request without confirming it; will retry', {
          checkInId: checkIn.id,
          ticketNumber: participant.ticketNumber,
        });

        throw new Error('Sympla did not confirm the check-in');
      }

      await this.db.eventParticipant.update({
        where: { id: participant.id },
        data: {
          symplaCheckedIn: true,
          symplaCheckInDate: checkIn.checkedInAt,
          // Documented but absent from both response shapes in practice; stored when present.
          symplaCheckInId: result.check_in_id ?? null,
        },
      });

      await this.audit(participant.eventId, participant.event.organizationId, 'SYMPLA_CHECKIN_MIRRORED', {
        checkInId: checkIn.id,
        eventParticipantId: participant.id,
        ticketNumber: participant.ticketNumber,
        symplaCheckInId: result.check_in_id ?? null,
      });

      return 'MIRRORED';
    } catch (error) {
      // A retryable failure (429, 5xx, network) is rethrown so the queue backs off and tries
      // again. A definitive rejection is not: retrying a 404 or a 422 forever would keep the
      // row hot and never succeed. It is recorded as a divergence for the reconciler instead.
      // Sympla answers 400 checkin:already_performed when the ticket is already in — which is
      // the goal state, not a failure. It happens whenever someone was checked in through the
      // organizer's own app and then also scans at one of our gates. Recording it as a rejection
      // would leave symplaCheckedIn false and have the reconciler re-push it forever.
      if (error instanceof SymplaApiError && error.isCheckInAlreadyPerformed) {
        await this.db.eventParticipant.update({
          where: { id: participant.id },
          data: { symplaCheckedIn: true, symplaCheckInDate: checkIn.checkedInAt },
        });

        await this.audit(participant.eventId, participant.event.organizationId, 'SYMPLA_CHECKIN_MIRRORED', {
          checkInId: checkIn.id,
          eventParticipantId: participant.id,
          ticketNumber: participant.ticketNumber,
          alreadyPerformedOnSympla: true,
        });

        return 'ALREADY_MIRRORED';
      }

      if (error instanceof SymplaApiError && !error.retryable) {
        await this.audit(participant.eventId, participant.event.organizationId, 'SYMPLA_CHECKIN_MIRRORED', {
          checkInId: checkIn.id,
          eventParticipantId: participant.id,
          ticketNumber: participant.ticketNumber,
          rejected: true,
          upstreamStatus: error.upstreamStatus,
          reason: error.message,
        });

        Logger.warn('Sympla rejected a mirrored check-in', {
          checkInId: checkIn.id,
          ticketNumber: participant.ticketNumber,
          upstreamStatus: error.upstreamStatus,
        });

        return 'REJECTED_BY_SYMPLA';
      }

      throw error;
    }
  }

  private async postCheckIn(
    client: SymplaHttpClient,
    symplaEventIdHash: string,
    participant: { symplaParticipantId: string | null; ticketNumber: string | null },
  ) {
    if (participant.symplaParticipantId) {
      return client.checkInByParticipantId(symplaEventIdHash, participant.symplaParticipantId);
    }

    // Only reachable for a slot whose participant id never came down; the ticket number is
    // guaranteed present by the caller's guard.
    return client.checkInByTicketNumber(symplaEventIdHash, participant.ticketNumber as string);
  }

  private async audit(
    eventId: string,
    organizationId: string,
    action: 'SYMPLA_CHECKIN_MIRRORED' | 'SYMPLA_CHECKIN_RECONCILED',
    metadata: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.db.auditLog.create({
        data: {
          action,
          description:
            action === 'SYMPLA_CHECKIN_MIRRORED'
              ? 'Check-in espelhado na Sympla.'
              : 'Check-in reconciliado com a Sympla.',
          organizationId,
          eventId,
          metadata: metadata as never,
        },
      });
    } catch (error) {
      Logger.error('Failed to write Sympla check-in audit log', {
        action,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
