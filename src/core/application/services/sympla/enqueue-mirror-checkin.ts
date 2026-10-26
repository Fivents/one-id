/**
 * Single entry point for "this check-in should reach Sympla".
 *
 * Called from every place a CheckIn row is created. It never throws: a check-in that succeeded
 * locally must stay succeeded even if the queue is unavailable, and the daily reconciliation
 * will catch anything that never got queued.
 */

import { JOB_KIND, kickJobDrain } from '@/core/infrastructure/jobs';
import { Logger } from '@/core/utils/logger';

export async function enqueueMirrorCheckIn(checkInId: string, organizationId?: string | null): Promise<void> {
  try {
    const { containerService } = await import('../container.service');

    await containerService.getJobQueue().enqueue({
      kind: JOB_KIND.SYMPLA_CHECKIN_MIRROR,
      payload: { checkInId },
      // One mirror per check-in, no matter how many times this is called.
      dedupeKey: `sympla:checkin:${checkInId}`,
      organizationId: organizationId ?? undefined,
    });

    // Throttled per instance: during a burst at the gate one drain mirrors the whole batch.
    kickJobDrain('checkin-mirror');
  } catch (error) {
    Logger.error('Failed to enqueue a Sympla check-in mirror', {
      checkInId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
