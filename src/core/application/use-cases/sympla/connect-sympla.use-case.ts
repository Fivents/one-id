import type { SymplaClientProvider } from '@/core/application/services/sympla-client.provider';
import type { IAuditLogRepository, ISecretCipher, ISymplaConnectionRepository } from '@/core/domain/contracts';
import type { SymplaConnectionEntity } from '@/core/domain/entities';
import { AppError, ErrorCode } from '@/core/errors';
import { Logger } from '@/core/utils/logger';

export interface ConnectSymplaInput {
  organizationId: string;
  token: string;
  userId?: string | null;
  sessionId?: string | null;
}

export class ConnectSymplaUseCase {
  constructor(
    private readonly connectionRepository: ISymplaConnectionRepository,
    private readonly cipher: ISecretCipher,
    private readonly clientProvider: SymplaClientProvider,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(input: ConnectSymplaInput): Promise<SymplaConnectionEntity> {
    const token = input.token.trim();

    if (!token) {
      throw new AppError({
        code: ErrorCode.SYMPLA_UNAUTHORIZED,
        message: 'Informe o token de acesso da Sympla.',
        httpStatus: 400,
        level: 'warning',
      });
    }

    // Health check before persisting: storing a token we have never exercised means the first
    // failure surfaces during a background sync, where nobody is watching.
    await this.clientProvider.fromToken(token).listEvents({ pageSize: 1, published: 'all' });

    const connection = await this.connectionRepository.upsertByOrganizationId(input.organizationId, {
      tokenEncrypted: this.cipher.encrypt(token),
      isActive: true,
    });

    await this.logAudit({
      action: 'SYMPLA_CONNECTION_CREATED',
      description: 'Conexão com a Sympla criada ou atualizada.',
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      sessionId: input.sessionId ?? null,
    });

    return connection;
  }

  private async logAudit(data: Parameters<IAuditLogRepository['create']>[0]): Promise<void> {
    try {
      await this.auditLogRepository.create(data);
    } catch (error) {
      // An audit write must never undo a connection the user just made successfully.
      Logger.error('Failed to write Sympla audit log', {
        action: data.action,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
