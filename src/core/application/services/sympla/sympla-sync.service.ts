/**
 * Orchestrates a Sympla sync: catalogue first (tickets reference presentations and orders by
 * id, so those rows must exist), then participants, then the watermark.
 */

import type { ISymplaConnectionRepository } from '@/core/domain/contracts';
import type { SymplaSyncError, SymplaSyncResult } from '@/core/domain/entities';
import { SymplaEventNotLinkedError } from '@/core/errors';
import { Logger } from '@/core/utils/logger';
import type { PrismaClient } from '@/generated/prisma/client';

import type { SymplaClientProvider } from '../sympla-client.provider';

import { SymplaCatalogSyncService } from './sympla-catalog-sync.service';
import { SymplaParticipantSyncService } from './sympla-participant-sync.service';

export interface SyncEventInput {
  eventId: string;
  /** Skips the catalogue pass when only fresh tickets are wanted. */
  participantsOnly?: boolean;
  signal?: AbortSignal;
}

export class SymplaSyncService {
  constructor(
    private readonly db: PrismaClient,
    private readonly clientProvider: SymplaClientProvider,
    private readonly connectionRepository: ISymplaConnectionRepository,
    private readonly catalogSync: SymplaCatalogSyncService = new SymplaCatalogSyncService(db),
    private readonly participantSync: SymplaParticipantSyncService = new SymplaParticipantSyncService(db),
  ) {}

  async syncEvent(input: SyncEventInput): Promise<SymplaSyncResult> {
    const startedAt = new Date();

    const link = await this.db.symplaEventLink.findUnique({
      where: { eventId: input.eventId },
      select: {
        symplaEventIdHash: true,
        lastSeedAt: true,
        event: { select: { id: true, organizationId: true } },
      },
    });

    if (!link) {
      throw new SymplaEventNotLinkedError({ eventId: input.eventId });
    }

    const organizationId = link.event.organizationId;
    const { client } = await this.clientProvider.forOrganization(organizationId);

    await this.connectionRepository.recordSyncOutcome(organizationId, { status: 'SYNCING' });

    const errors: SymplaSyncError[] = [];
    let eventsSynced = 0;
    let presentationsSynced = 0;
    let ordersSynced = 0;

    try {
      if (!input.participantsOnly) {
        const catalog = await this.catalogSync.execute({
          eventId: input.eventId,
          symplaEventIdHash: link.symplaEventIdHash,
          client,
          signal: input.signal,
        });

        eventsSynced = catalog.eventsSynced;
        presentationsSynced = catalog.presentationsSynced;
        ordersSynced = catalog.ordersSynced;
        errors.push(...catalog.errors);
      }

      const participants = await this.participantSync.execute({
        eventId: input.eventId,
        organizationId,
        symplaEventIdHash: link.symplaEventIdHash,
        client,
        from: link.lastSeedAt,
        signal: input.signal,
      });

      errors.push(...participants.errors);

      // Advance the watermark only from what Sympla actually reported. Using "now" would skip
      // tickets written while this run was in flight.
      if (participants.latestTicketUpdatedAt) {
        await this.db.symplaEventLink.update({
          where: { eventId: input.eventId },
          data: { lastSeedAt: participants.latestTicketUpdatedAt },
        });
      } else if (!link.lastSeedAt) {
        // First full sync of an event with no tickets yet: mark it seeded so the next run is
        // incremental instead of replaying the whole catalogue.
        await this.db.symplaEventLink.update({
          where: { eventId: input.eventId },
          data: { lastSeedAt: startedAt },
        });
      }

      const finishedAt = new Date();
      const result: SymplaSyncResult = {
        eventsSynced,
        presentationsSynced,
        ordersSynced,
        participantsSynced: participants.participantsSynced,
        errors,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
      };

      // Per-ticket failures are reported, not fatal: the run did sync everything else, and
      // marking it FAILED would trip the reconnect nudge over a single malformed row.
      await this.connectionRepository.recordSyncOutcome(organizationId, {
        status: 'COMPLETED',
        result,
        syncedAt: finishedAt,
      });

      await this.audit(input.eventId, organizationId, 'SYMPLA_SYNC_COMPLETED', result);

      return result;
    } catch (error) {
      const finishedAt = new Date();
      const message = error instanceof Error ? error.message : String(error);

      const result: SymplaSyncResult = {
        eventsSynced,
        presentationsSynced,
        ordersSynced,
        participantsSynced: 0,
        errors: [...errors, { type: 'SYNC_ABORTED', message }],
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
      };

      await this.connectionRepository.recordSyncOutcome(organizationId, {
        status: 'FAILED',
        result,
        syncedAt: finishedAt,
      });

      await this.audit(input.eventId, organizationId, 'SYMPLA_SYNC_FAILED', result);

      throw error;
    }
  }

  /** Every linked event of an organization, one after another. */
  async syncOrganization(organizationId: string, signal?: AbortSignal): Promise<SymplaSyncResult[]> {
    const links = await this.db.symplaEventLink.findMany({
      where: { event: { organizationId, deletedAt: null } },
      select: { eventId: true },
    });

    const results: SymplaSyncResult[] = [];

    for (const link of links) {
      try {
        results.push(await this.syncEvent({ eventId: link.eventId, signal }));
      } catch (error) {
        // One broken event must not stop the others; syncEvent already recorded the failure.
        Logger.error('Sympla event sync failed inside organization sync', {
          organizationId,
          eventId: link.eventId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  private async audit(
    eventId: string,
    organizationId: string,
    action: 'SYMPLA_SYNC_COMPLETED' | 'SYMPLA_SYNC_FAILED',
    result: SymplaSyncResult,
  ): Promise<void> {
    try {
      await this.db.auditLog.create({
        data: {
          action,
          description:
            action === 'SYMPLA_SYNC_COMPLETED'
              ? 'Sincronização com a Sympla concluída.'
              : 'Sincronização com a Sympla falhou.',
          organizationId,
          eventId,
          metadata: {
            eventsSynced: result.eventsSynced,
            presentationsSynced: result.presentationsSynced,
            ordersSynced: result.ordersSynced,
            participantsSynced: result.participantsSynced,
            errorCount: result.errors.length,
            durationMs: result.durationMs,
          },
        },
      });
    } catch (error) {
      Logger.error('Failed to write Sympla sync audit log', {
        action,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
