/**
 * Job handler registry.
 *
 * Deliberately a static map built from explicit imports rather than a self-registering
 * side-effect: in Next.js a handler module that nobody imports simply never registers, and
 * the resulting "job silently never runs" is invisible. Adding a kind here is a compile-time
 * decision, not a load-order accident.
 *
 * The container is resolved inside each handler rather than imported at module scope: it boots
 * the validated environment, and merely *describing* the set of job kinds should not require a
 * fully configured process (it would make this registry unloadable in a unit test).
 */

import type { Prisma } from '@/generated/prisma/client';

import type { ClaimedJob, JobKind } from './job-queue';

export type JobHandler = (payload: Prisma.JsonValue, job: ClaimedJob) => Promise<void>;

function readString(payload: Prisma.JsonValue, key: string): string {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error(`Job payload is not an object; expected "${key}"`);
  }

  const value = (payload as Record<string, unknown>)[key];

  if (typeof value !== 'string' || !value) {
    throw new Error(`Job payload is missing "${key}"`);
  }

  return value;
}

async function symplaSyncService() {
  const { containerService } = await import('@/core/application/services/container.service');

  return containerService.getSymplaSyncService();
}

export const jobHandlers: Partial<Record<JobKind, JobHandler>> = {
  'sympla.sync.event': async (payload) => {
    const service = await symplaSyncService();
    await service.syncEvent({ eventId: readString(payload, 'eventId') });
  },

  'sympla.sync.full': async (payload) => {
    const service = await symplaSyncService();
    await service.syncOrganization(readString(payload, 'organizationId'));
  },

  // sympla.checkin.mirror / sympla.checkin.reconcile land in P2.
};

export function getJobHandler(kind: string): JobHandler | undefined {
  return jobHandlers[kind as JobKind];
}
