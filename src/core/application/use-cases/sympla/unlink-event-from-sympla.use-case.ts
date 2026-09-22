import type { IAuditLogRepository, ISymplaEventLinkRepository } from '@/core/domain/contracts';
import { SymplaEventNotLinkedError } from '@/core/errors';
import { Logger } from '@/core/utils/logger';

export interface UnlinkEventFromSymplaInput {
  eventId: string;
  organizationId: string;
  userId?: string | null;
}

export class UnlinkEventFromSymplaUseCase {
  constructor(
    private readonly linkRepository: ISymplaEventLinkRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(input: UnlinkEventFromSymplaInput): Promise<void> {
    const removed = await this.linkRepository.unlink(input.eventId);

    if (!removed) {
      throw new SymplaEventNotLinkedError({ eventId: input.eventId });
    }

    try {
      await this.auditLogRepository.create({
        action: 'SYMPLA_EVENT_UNLINKED',
        description: 'Vínculo com a Sympla removido. Os participantes já importados foram mantidos.',
        organizationId: input.organizationId,
        eventId: input.eventId,
        userId: input.userId ?? null,
      });
    } catch (error) {
      Logger.error('Failed to write Sympla audit log', {
        action: 'SYMPLA_EVENT_UNLINKED',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
