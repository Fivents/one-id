/**
 * Postgres-backed job queue.
 *
 * There is no worker process — /api/cron drains this on a schedule, so the queue has to be
 * safe against several overlapping drains hitting the same rows. That is what the
 * `FOR UPDATE SKIP LOCKED` claim below buys: two concurrent cron invocations pick up disjoint
 * work instead of both running the same sync.
 */

import type { PrismaClient } from '@/generated/prisma/client';
import { Prisma } from '@/generated/prisma/client';

export const JOB_KIND = {
  SYMPLA_SYNC_FULL: 'sympla.sync.full',
  SYMPLA_SYNC_EVENT: 'sympla.sync.event',
  SYMPLA_CHECKIN_MIRROR: 'sympla.checkin.mirror',
  SYMPLA_CHECKIN_RECONCILE: 'sympla.checkin.reconcile',
} as const;

export type JobKind = (typeof JOB_KIND)[keyof typeof JOB_KIND];

/** A RUNNING job whose lock is older than this is assumed dead (serverless timeout, crash). */
export const STALLED_LOCK_MS = 10 * 60 * 1000;

const BACKOFF_BASE_MS = 30_000;
const BACKOFF_MAX_MS = 60 * 60 * 1000;

export interface EnqueueJobInput {
  kind: JobKind;
  payload: Record<string, unknown>;
  /**
   * Collapses duplicate work. While a job with this key is PENDING or RUNNING, further
   * enqueues are no-ops. Cleared when the job settles, so the next cycle can enqueue again.
   */
  dedupeKey?: string;
  runAt?: Date;
  organizationId?: string;
  maxAttempts?: number;
}

export interface EnqueueJobResult {
  id: string | null;
  deduped: boolean;
}

export interface ClaimedJob {
  id: string;
  kind: string;
  payload: Prisma.JsonValue;
  attempts: number;
  maxAttempts: number;
  organizationId: string | null;
}

interface ClaimedJobRow {
  id: string;
  kind: string;
  payload: Prisma.JsonValue;
  attempts: number;
  max_attempts: number;
  organization_id: string | null;
}

export function computeBackoffMs(attempts: number): number {
  return Math.min(BACKOFF_BASE_MS * 2 ** Math.max(0, attempts - 1), BACKOFF_MAX_MS);
}

export class JobQueue {
  constructor(private readonly db: PrismaClient) {}

  async enqueue(input: EnqueueJobInput): Promise<EnqueueJobResult> {
    try {
      const job = await this.db.backgroundJob.create({
        data: {
          kind: input.kind,
          payload: input.payload as Prisma.InputJsonValue,
          dedupeKey: input.dedupeKey ?? null,
          runAt: input.runAt ?? new Date(),
          organizationId: input.organizationId ?? null,
          ...(input.maxAttempts === undefined ? {} : { maxAttempts: input.maxAttempts }),
        },
        select: { id: true },
      });

      return { id: job.id, deduped: false };
    } catch (error) {
      // P2002 on dedupe_key means the same work is already queued or running. That is the
      // designed outcome, not a failure.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { id: null, deduped: true };
      }

      throw error;
    }
  }

  /**
   * Atomically moves up to `limit` due jobs to RUNNING and returns them. SKIP LOCKED means a
   * concurrent drain never blocks on, or steals, rows this one already took.
   */
  async claim(limit: number): Promise<ClaimedJob[]> {
    const rows = await this.db.$queryRaw<ClaimedJobRow[]>`
      UPDATE background_jobs
      SET status = 'RUNNING',
          locked_at = NOW(),
          attempts = attempts + 1,
          updated_at = NOW()
      WHERE id IN (
        SELECT id
        FROM background_jobs
        WHERE status = 'PENDING'
          AND run_at <= NOW()
        ORDER BY run_at ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, kind, payload, attempts, max_attempts, organization_id
    `;

    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      payload: row.payload,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      organizationId: row.organization_id,
    }));
  }

  async complete(id: string): Promise<void> {
    await this.db.backgroundJob.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        lockedAt: null,
        lastError: null,
        // Freeing the key lets the next cycle enqueue the same logical work again.
        dedupeKey: null,
      },
    });
  }

  /**
   * Re-schedules with exponential backoff, or gives up once maxAttempts is spent.
   * `attempts` was already incremented by claim().
   */
  async fail(job: ClaimedJob, error: unknown): Promise<{ willRetry: boolean }> {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const willRetry = job.attempts < job.maxAttempts;

    await this.db.backgroundJob.update({
      where: { id: job.id },
      data: willRetry
        ? {
            status: 'PENDING',
            lockedAt: null,
            lastError: message,
            runAt: new Date(Date.now() + computeBackoffMs(job.attempts)),
          }
        : {
            status: 'FAILED',
            lockedAt: null,
            lastError: message,
            completedAt: new Date(),
            dedupeKey: null,
          },
    });

    return { willRetry };
  }

  /** Returns jobs whose runner died mid-flight to the pool. */
  async recoverStalled(olderThanMs: number = STALLED_LOCK_MS): Promise<number> {
    const threshold = new Date(Date.now() - olderThanMs);

    const result = await this.db.backgroundJob.updateMany({
      where: { status: 'RUNNING', lockedAt: { lt: threshold } },
      data: { status: 'PENDING', lockedAt: null },
    });

    return result.count;
  }
}
