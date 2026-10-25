import { afterEach, describe, expect, it, vi } from 'vitest';

import { jobHandlers } from '@/core/infrastructure/jobs/job-handlers';
import type { ClaimedJob, JobKind } from '@/core/infrastructure/jobs/job-queue';
import { computeBackoffMs } from '@/core/infrastructure/jobs/job-queue';
import { drainJobs, type JobQueuePort } from '@/core/infrastructure/jobs/job-runner';

const KIND = 'sympla.sync.full' as JobKind;

function makeJob(overrides: Partial<ClaimedJob> = {}): ClaimedJob {
  return {
    id: 'job-1',
    kind: KIND,
    payload: { organizationId: 'org-1' },
    attempts: 1,
    maxAttempts: 5,
    organizationId: 'org-1',
    ...overrides,
  };
}

/** Hands out the given batches in order, then nothing. */
function makeQueue(batches: ClaimedJob[][]): JobQueuePort & {
  completed: string[];
  failures: Array<{ job: ClaimedJob; error: unknown }>;
} {
  const queue = [...batches];
  const completed: string[] = [];
  const failures: Array<{ job: ClaimedJob; error: unknown }> = [];

  return {
    completed,
    failures,
    async claim() {
      return queue.shift() ?? [];
    },
    async complete(id) {
      completed.push(id);
    },
    async fail(job, error) {
      failures.push({ job, error });
      return { willRetry: job.attempts < job.maxAttempts };
    },
    async recoverStalled() {
      return 0;
    },
  };
}

afterEach(() => {
  delete jobHandlers[KIND];
});

describe('computeBackoffMs', () => {
  it('grows exponentially from the first failure', () => {
    expect(computeBackoffMs(1)).toBe(30_000);
    expect(computeBackoffMs(2)).toBe(60_000);
    expect(computeBackoffMs(3)).toBe(120_000);
  });

  it('caps at one hour', () => {
    expect(computeBackoffMs(50)).toBe(60 * 60 * 1000);
  });
});

describe('drainJobs', () => {
  it('runs the handler and completes the job', async () => {
    const handler = vi.fn(async () => {});
    jobHandlers[KIND] = handler;

    const queue = makeQueue([[makeJob()]]);
    const result = await drainJobs({ queue });

    expect(handler).toHaveBeenCalledOnce();
    expect(queue.completed).toEqual(['job-1']);
    expect(result).toMatchObject({ claimed: 1, completed: 1, failed: 0, retrying: 0, stoppedReason: 'EMPTY' });
  });

  it('marks a job for retry when the handler throws and attempts remain', async () => {
    jobHandlers[KIND] = async () => {
      throw new Error('sympla unavailable');
    };

    const queue = makeQueue([[makeJob({ attempts: 2, maxAttempts: 5 })]]);
    const result = await drainJobs({ queue });

    expect(queue.completed).toEqual([]);
    expect(queue.failures).toHaveLength(1);
    expect(result).toMatchObject({ retrying: 1, failed: 0 });
  });

  it('gives up once attempts are exhausted', async () => {
    jobHandlers[KIND] = async () => {
      throw new Error('still broken');
    };

    const queue = makeQueue([[makeJob({ attempts: 5, maxAttempts: 5 })]]);
    const result = await drainJobs({ queue });

    expect(result).toMatchObject({ retrying: 0, failed: 1 });
  });

  it('fails a job whose kind has no handler instead of retrying it forever', async () => {
    // A kind that is deliberately never registered, so adding real handlers cannot make this
    // test silently stop testing anything.
    const queue = makeQueue([[makeJob({ kind: 'sympla.kind.that.does.not.exist' })]]);
    const result = await drainJobs({ queue });

    expect(result).toMatchObject({ failed: 1, completed: 0, retrying: 0 });
    expect(queue.failures[0].job.attempts).toBe(queue.failures[0].job.maxAttempts);
  });

  it('stops at maxJobs', async () => {
    jobHandlers[KIND] = async () => {};

    const queue = makeQueue([
      [makeJob({ id: 'a' }), makeJob({ id: 'b' })],
      [makeJob({ id: 'c' })],
    ]);
    const result = await drainJobs({ queue, maxJobs: 2, batchSize: 2 });

    expect(result).toMatchObject({ claimed: 2, completed: 2, stoppedReason: 'MAX_JOBS' });
    expect(queue.completed).toEqual(['a', 'b']);
  });

  it('stops when the time budget is spent', async () => {
    jobHandlers[KIND] = async () => {};

    let clock = 0;
    const queue = makeQueue([[makeJob({ id: 'a' })], [makeJob({ id: 'b' })]]);

    const result = await drainJobs({
      queue,
      budgetMs: 100,
      batchSize: 1,
      now: () => {
        clock += 60;
        return clock;
      },
    });

    expect(result.stoppedReason).toBe('BUDGET');
    expect(result.claimed).toBeLessThan(2);
  });

  it('reports jobs recovered from a dead runner', async () => {
    const queue = { ...makeQueue([[]]), recoverStalled: async () => 3 };
    const result = await drainJobs({ queue });

    expect(result.recovered).toBe(3);
  });

  it('keeps draining after one job fails', async () => {
    let call = 0;
    jobHandlers[KIND] = async () => {
      call += 1;
      if (call === 1) throw new Error('transient');
    };

    const queue = makeQueue([[makeJob({ id: 'a' }), makeJob({ id: 'b' })]]);
    const result = await drainJobs({ queue, batchSize: 2 });

    expect(result).toMatchObject({ claimed: 2, completed: 1, retrying: 1 });
    expect(queue.completed).toEqual(['b']);
  });
});
