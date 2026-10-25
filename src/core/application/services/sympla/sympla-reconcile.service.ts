/**
 * Closes the gap between the two gate lists.
 *
 * Someone can check in through the organizer's own Sympla app at another door, and a mirror
 * job can be rejected or lost. Neither side is authoritative on its own, so this compares them
 * and repairs the difference in whichever direction it points.
 *
 * It reconciles against *local* columns rather than re-reading the API row by row — the
 * participant sync already keeps symplaCheckedIn fresh. But it forces a full (non-incremental)
 * sync first: the incremental pass filters on ticket_updated_at, and it is not guaranteed that
 * a check-in on Sympla's side bumps that timestamp. Running daily, that cost is acceptable;
 * silently missing half the divergences would not be.
 */

import { JOB_KIND, type JobQueue } from '@/core/infrastructure/jobs';
import { Logger } from '@/core/utils/logger';
import type { PrismaClient } from '@/generated/prisma/client';

import type { SymplaSyncService } from './sympla-sync.service';

export interface ReconcileResult {
  /** Present on Sympla, missing here — a local check-in was created. */
  importedFromSympla: number;
  /** Present here, missing on Sympla — a mirror job was queued. */
  queuedForMirror: number;
  checked: number;
}

/** Bounds one run; anything left over is picked up by the next daily pass. */
const MAX_REPAIRS_PER_RUN = 2_000;

export class SymplaReconcileService {
  constructor(
    private readonly db: PrismaClient,
    private readonly jobQueue: JobQueue,
    private readonly syncService: SymplaSyncService,
  ) {}

  async reconcileEvent(eventId: string, options: { fullResync?: boolean } = {}): Promise<ReconcileResult> {
    if (options.fullResync !== false) {
      // Rewind the watermark so the next sync re-reads every ticket, check-in state included.
      await this.db.symplaEventLink.update({ where: { eventId }, data: { lastSeedAt: null } });
      await this.syncService.syncEvent({ eventId, participantsOnly: true });
    }

    const result: ReconcileResult = { importedFromSympla: 0, queuedForMirror: 0, checked: 0 };

    const event = await this.db.event.findUnique({
      where: { id: eventId },
      select: { organizationId: true },
    });

    if (!event) return result;

    const slots = await this.db.eventParticipant.findMany({
      where: { eventId, deletedAt: null, ticketNumber: { not: null } },
      select: {
        id: true,
        ticketNumber: true,
        symplaCheckedIn: true,
        symplaCheckInDate: true,
        checkIns: { select: { id: true, checkedInAt: true }, orderBy: { checkedInAt: 'asc' }, take: 1 },
      },
      take: MAX_REPAIRS_PER_RUN,
    });

    for (const slot of slots) {
      result.checked += 1;
      const localCheckIn = slot.checkIns[0];

      if (slot.symplaCheckedIn && !localCheckIn) {
        await this.importCheckIn(slot.id, eventId, event.organizationId, slot.symplaCheckInDate);
        result.importedFromSympla += 1;
        continue;
      }

      if (!slot.symplaCheckedIn && localCheckIn) {
        const queued = await this.queueMirror(localCheckIn.id, event.organizationId);
        if (queued) result.queuedForMirror += 1;
      }
    }

    return result;
  }

  private async importCheckIn(
    eventParticipantId: string,
    eventId: string,
    organizationId: string,
    symplaCheckInDate: Date | null,
  ): Promise<void> {
    try {
      const checkIn = await this.db.checkIn.create({
        data: {
          method: 'MANUAL',
          confidence: null,
          // Sympla's own timestamp when it gave us one: the earliest check-in is the true one,
          // and inventing "now" would misreport when the attendee actually arrived.
          checkedInAt: symplaCheckInDate ?? new Date(),
          eventParticipantId,
          // No totem: this check-in did not happen at one of ours.
          totemEventSubscriptionId: null,
        },
        select: { id: true },
      });

      await this.db.auditLog.create({
        data: {
          action: 'SYMPLA_CHECKIN_RECONCILED',
          description: 'Check-in importado da Sympla (realizado fora dos totems).',
          organizationId,
          eventId,
          metadata: { checkInId: checkIn.id, eventParticipantId, direction: 'FROM_SYMPLA' },
        },
      });
    } catch (error) {
      Logger.error('Failed to import a Sympla check-in', {
        eventParticipantId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async queueMirror(checkInId: string, organizationId: string): Promise<boolean> {
    try {
      const outcome = await this.jobQueue.enqueue({
        kind: JOB_KIND.SYMPLA_CHECKIN_MIRROR,
        payload: { checkInId },
        dedupeKey: `sympla:checkin:${checkInId}`,
        organizationId,
      });

      return !outcome.deduped;
    } catch (error) {
      Logger.error('Failed to queue a check-in mirror during reconciliation', {
        checkInId,
        error: error instanceof Error ? error.message : String(error),
      });

      return false;
    }
  }
}
