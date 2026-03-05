import { IAuditLogRepository } from '@/core/domain/contracts';
import type { AuditLogEntity } from '@/core/domain/entities/audit-log.entity';

export class GetAuditLogUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(id: string): Promise<AuditLogEntity> {
    const log = await this.auditLogRepository.findById(id);

    if (!log) {
      throw new GetAuditLogError('Audit log not found.');
    }

    return log;
  }
}

export class GetAuditLogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetAuditLogError';
  }
}
