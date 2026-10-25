/**
 * Drains the job queue within a time budget.
 *
 * The budget exists because this runs inside a serverless request: overrunning it gets the
 * process killed mid-job, which is exactly what recoverStalled() has to clean up later. Better
 * to stop early and let the next cron tick pick up the rest.
 */

import { Logger } from '@/core/utils/logger';

import { getJobHandler } from './job-handlers';
import type { ClaimedJob } from './job-queue';

/**
 * The slice of JobQueue the runner actually needs. Narrow on purpose: it keeps the runner
 * testable without a database, and JobQueue satisfies it structurally.
 */
export interface JobQueuePort {
  claim(limit: number): Promise<ClaimedJob[]>;
  complete(id: string): Promise<void>;
  fail(job: ClaimedJob, error: unknown): Promise<{ willRetry: boolean }>;
  recoverStalled(olderThanMs?: number): Promise<number>;
}

export interface DrainOptions {
  queue: JobQueuePort;
  maxJobs?: number;
  budgetMs?: number;
  batchSize?: number;
  now?: () => number;
}

export interface DrainResult {
  claimed: number;
  completed: number;
  failed: number;
  retrying: number;
  recovered: number;
  stoppedReason: 'EMPTY' | 'MAX_JOBS' | 'BUDGET';
}

const DEFAULT_MAX_JOBS = 25;
const DEFAULT_BUDGET_MS = 45_000;
const DEFAULT_BATCH_SIZE = 5;

export async function drainJobs(options: DrainOptions): Promise<DrainResult> {
  const { queue } = options;
  const maxJobs = options.maxJobs ?? DEFAULT_MAX_JOBS;
  const budgetMs = options.budgetMs ?? DEFAULT_BUDGET_MS;
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const now = options.now ?? Date.now;

  const startedAt = now();
  const recovered = await queue.recoverStalled();

  const result: DrainResult = {
    claimed: 0,
    completed: 0,
    failed: 0,
    retrying: 0,
    recovered,
    stoppedReason: 'EMPTY',
  };

  while (result.claimed < maxJobs) {
    if (now() - startedAt >= budgetMs) {
      result.stoppedReason = 'BUDGET';
      return result;
    }

    const batch = await queue.claim(Math.min(batchSize, maxJobs - result.claimed));
    if (batch.length === 0) {
      result.stoppedReason = 'EMPTY';
      return result;
    }

    result.claimed += batch.length;

    // Sequential on purpose: these jobs hit the same third-party API under a shared rate
    // limit, so running a batch in parallel just converts throughput into 429s.
    for (const job of batch) {
      await runJob(queue, job, result);
    }
  }

  result.stoppedReason = 'MAX_JOBS';
  return result;
}

async function runJob(queue: JobQueuePort, job: ClaimedJob, result: DrainResult): Promise<void> {
  const handler = getJobHandler(job.kind);

  if (!handler) {
    // An unknown kind is a deploy-shape problem, not a transient one — retrying it forever
    // would just keep the row hot. Fail it outright so it shows up.
    await queue.fail({ ...job, attempts: job.maxAttempts }, new Error(`No handler registered for job kind "${job.kind}"`));
    result.failed += 1;
    Logger.error('Job kind has no handler', { jobId: job.id, kind: job.kind });
    return;
  }

  try {
    await handler(job.payload, job);
    await queue.complete(job.id);
    result.completed += 1;
  } catch (error) {
    const { willRetry } = await queue.fail(job, error);

    if (willRetry) {
      result.retrying += 1;
    } else {
      result.failed += 1;
    }

    Logger.error('Job execution failed', {
      jobId: job.id,
      kind: job.kind,
      attempts: job.attempts,
      willRetry,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
