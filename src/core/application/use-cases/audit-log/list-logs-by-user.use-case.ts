import { IAuditLogRepository } from '@/core/domain/contracts';
import type { AuditLogEntity } from '@/core/domain/entities/audit-log.entity';

export class ListLogsByUserUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(userId: string): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.findByUser(userId);
  }
}
