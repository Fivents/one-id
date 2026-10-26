import { after } from 'next/server';

import { prisma } from '@/core/infrastructure/prisma-client';
import { Logger } from '@/core/utils/logger';

import { JobQueue } from './job-queue';
import { drainJobs } from './job-runner';

/**
 * On Vercel Hobby the cron can only run once a day, so the queue is also drained right after
 * the requests that create work ("sync now", linking an event, every check-in). `after()` runs
 * once the response is sent, so callers pay no latency. Claims use SKIP LOCKED, so several
 * concurrent drains are safe; the throttle only avoids pointless ones during check-in bursts.
 */
const KICK_BUDGET_MS = 40_000;
const MIN_KICK_INTERVAL_MS = 15_000;

let lastKickAt = 0;

export function kickJobDrain(reason: string, options: { force?: boolean } = {}): void {
  const now = Date.now();
  if (!options.force && now - lastKickAt < MIN_KICK_INTERVAL_MS) return;
  lastKickAt = now;

  try {
    after(async () => {
      try {
        const result = await drainJobs({ queue: new JobQueue(prisma), budgetMs: KICK_BUDGET_MS });
        if (result.claimed > 0) {
          Logger.info('Job queue drained after request', { reason, ...result });
        }
      } catch (error) {
        Logger.error('Job drain after request failed', {
          reason,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  } catch (error) {
    // Outside a request scope (scripts, tests) there is nothing to attach to; the daily cron
    // and the next request-triggered drain will pick the job up.
    Logger.warn('Could not schedule a job drain', {
      reason,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
