import { CreateAuditLogData, IAuditLogRepository } from '@/core/domain/contracts';
import type { AuditLogEntity } from '@/core/domain/entities/audit-log.entity';

export class CreateAuditLogUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(data: CreateAuditLogData): Promise<AuditLogEntity> {
    return this.auditLogRepository.create(data);
  }
}
