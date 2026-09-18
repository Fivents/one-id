/**
 * Job handler registry.
 *
 * Deliberately a static map built from explicit imports rather than a self-registering
 * side-effect: in Next.js a handler module that nobody imports simply never registers, and
 * the resulting "job silently never runs" is invisible. Adding a kind here is a compile-time
 * decision, not a load-order accident.
 */

import type { Prisma } from '@/generated/prisma/client';

import type { ClaimedJob, JobKind } from './job-queue';

export type JobHandler = (payload: Prisma.JsonValue, job: ClaimedJob) => Promise<void>;

export const jobHandlers: Partial<Record<JobKind, JobHandler>> = {
  // sympla.sync.full / sympla.sync.event land in P1.
  // sympla.checkin.mirror / sympla.checkin.reconcile land in P2.
};

export function getJobHandler(kind: string): JobHandler | undefined {
  return jobHandlers[kind as JobKind];
}
