import type { IAuditLogRepository, ISymplaConnectionRepository } from '@/core/domain/contracts';
import { SymplaNotConnectedError } from '@/core/errors';
import { Logger } from '@/core/utils/logger';

export interface DisconnectSymplaInput {
  organizationId: string;
  userId?: string | null;
  sessionId?: string | null;
}

export class DisconnectSymplaUseCase {
  constructor(
    private readonly connectionRepository: ISymplaConnectionRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(input: DisconnectSymplaInput): Promise<void> {
    const connection = await this.connectionRepository.deactivateByOrganizationId(input.organizationId);

    if (!connection) {
      throw new SymplaNotConnectedError({ organizationId: input.organizationId });
    }

    try {
      await this.auditLogRepository.create({
        action: 'SYMPLA_CONNECTION_REMOVED',
        description: 'Conexão com a Sympla desativada.',
        organizationId: input.organizationId,
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
      });
    } catch (error) {
      Logger.error('Failed to write Sympla audit log', {
        action: 'SYMPLA_CONNECTION_REMOVED',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
