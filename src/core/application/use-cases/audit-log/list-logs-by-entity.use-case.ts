import { IAuditLogRepository } from '@/core/domain/contracts';
import type { AuditLogEntity } from '@/core/domain/entities/audit-log.entity';

export class ListLogsByEntityUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(entityType: string, entityId: string): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.findByEntity(entityType, entityId);
  }
}
