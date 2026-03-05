import { IAuditLogRepository } from '@/core/domain/contracts';
import type { AuditLogEntity } from '@/core/domain/entities/audit-log.entity';
import { AuditLogNotFoundError } from '@/core/errors';

export class GetAuditLogUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(id: string): Promise<AuditLogEntity> {
    const log = await this.auditLogRepository.findById(id);

    if (!log) {
      throw new AuditLogNotFoundError(id);
    }

    return log;
  }
}
