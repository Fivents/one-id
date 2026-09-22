import type { IAuditLogRepository, ISymplaEventLinkRepository } from '@/core/domain/contracts';
import type { SymplaEventLinkEntity } from '@/core/domain/entities';
import { SymplaEventAlreadyLinkedError } from '@/core/errors';
import { JOB_KIND, type JobQueue } from '@/core/infrastructure/jobs';
import { Logger } from '@/core/utils/logger';

import type { SymplaClientProvider } from '../../services/sympla-client.provider';

export interface LinkEventToSymplaInput {
  eventId: string;
  organizationId: string;
  symplaEventIdHash: string;
  userId?: string | null;
}

export class LinkEventToSymplaUseCase {
  constructor(
    private readonly linkRepository: ISymplaEventLinkRepository,
    private readonly clientProvider: SymplaClientProvider,
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly jobQueue: JobQueue,
  ) {}

  async execute(input: LinkEventToSymplaInput): Promise<SymplaEventLinkEntity> {
    const alreadyLinked = await this.linkRepository.findBySymplaEventIdHash(input.symplaEventIdHash);

    if (alreadyLinked && alreadyLinked.eventId !== input.eventId) {
      // Two ONE-ID events behind one Sympla event would mirror check-ins against each other.
      throw new SymplaEventAlreadyLinkedError({
        symplaEventIdHash: input.symplaEventIdHash,
        linkedEventId: alreadyLinked.eventId,
      });
    }

    // Fetching it first proves the token can actually see this event — a 403 here is far
    // cheaper to explain than a background sync that never produces anything.
    const { client } = await this.clientProvider.forOrganization(input.organizationId);
    const symplaEvent = await client.getEvent(input.symplaEventIdHash);

    const link = await this.linkRepository.link({
      eventId: input.eventId,
      symplaEventIdHash: input.symplaEventIdHash,
      symplaUrl: symplaEvent.url,
      imageUrl: symplaEvent.image,
      referenceId: symplaEvent.reference_id,
      categoryPrimary: symplaEvent.category_prim?.name,
      categorySecondary: symplaEvent.category_sec?.name,
      hostName: symplaEvent.host?.name,
      publishedOnSympla: symplaEvent.published ?? false,
      cancelledOnSympla: symplaEvent.cancelled ?? false,
    });

    await this.enqueueInitialSync(input.eventId, input.organizationId);

    await this.audit({
      action: 'SYMPLA_EVENT_LINKED',
      description: `Evento vinculado ao evento Sympla "${symplaEvent.name}".`,
      organizationId: input.organizationId,
      eventId: input.eventId,
      userId: input.userId ?? null,
      metadata: { symplaEventIdHash: input.symplaEventIdHash },
    });

    return link;
  }

  private async enqueueInitialSync(eventId: string, organizationId: string): Promise<void> {
    try {
      await this.jobQueue.enqueue({
        kind: JOB_KIND.SYMPLA_SYNC_EVENT,
        payload: { eventId },
        dedupeKey: `sympla:event:${eventId}`,
        organizationId,
      });
    } catch (error) {
      // The link is valid without the job; the scheduled sync will pick it up anyway.
      Logger.error('Failed to enqueue initial Sympla sync', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async audit(data: Parameters<IAuditLogRepository['create']>[0]): Promise<void> {
    try {
      await this.auditLogRepository.create(data);
    } catch (error) {
      Logger.error('Failed to write Sympla audit log', {
        action: data.action,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
