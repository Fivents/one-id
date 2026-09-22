/**
 * Decides which linked events are due for a sync and puts them on the queue.
 *
 * The cadence needs no extra state. A job is enqueued under a per-event dedupe key with a
 * `runAt` in the future; while it sits PENDING that key blocks any further enqueue, and the key
 * is released only once the job settles. So the delay chosen here *is* the interval: an event
 * inside its window is enqueued to run immediately and therefore re-enqueued on the next tick,
 * while a distant event's job waits out its delay before anything else can be queued for it.
 */

import { JOB_KIND, type JobQueue } from '@/core/infrastructure/jobs';
import { Logger } from '@/core/utils/logger';
import type { PrismaClient } from '@/generated/prisma/client';

/** How far around an event's dates it counts as "happening", and syncs at full speed. */
export const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const IDLE_SYNC_DELAY_MS = 15 * 60 * 1000;

export interface ScheduleResult {
  enqueued: number;
  deduped: number;
}

export class SymplaSchedulerService {
  constructor(
    private readonly db: PrismaClient,
    private readonly jobQueue: JobQueue,
  ) {}

  async enqueueDueSyncs(now: Date = new Date()): Promise<ScheduleResult> {
    const result: ScheduleResult = { enqueued: 0, deduped: 0 };

    const links = await this.db.symplaEventLink.findMany({
      where: {
        event: {
          deletedAt: null,
          // A revoked or disconnected integration must stop generating work.
          organization: { symplaConnection: { isActive: true } },
        },
      },
      select: {
        eventId: true,
        event: { select: { organizationId: true, startsAt: true, endsAt: true } },
      },
    });

    for (const link of links) {
      const isActive = this.isWithinActiveWindow(link.event.startsAt, link.event.endsAt, now);
      const runAt = isActive ? now : new Date(now.getTime() + IDLE_SYNC_DELAY_MS);

      try {
        const outcome = await this.jobQueue.enqueue({
          kind: JOB_KIND.SYMPLA_SYNC_EVENT,
          payload: { eventId: link.eventId },
          dedupeKey: `sympla:event:${link.eventId}`,
          organizationId: link.event.organizationId,
          runAt,
        });

        if (outcome.deduped) result.deduped += 1;
        else result.enqueued += 1;
      } catch (error) {
        Logger.error('Failed to schedule Sympla sync', {
          eventId: link.eventId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }

  private isWithinActiveWindow(startsAt: Date, endsAt: Date, now: Date): boolean {
    return (
      now.getTime() >= startsAt.getTime() - ACTIVE_WINDOW_MS &&
      now.getTime() <= endsAt.getTime() + ACTIVE_WINDOW_MS
    );
  }
}
