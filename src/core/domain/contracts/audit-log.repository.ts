import type { AuditAction, AuditLogEntity } from '../entities/audit-log.entity';

export interface CreateAuditLogData {
  action: AuditAction;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  sessionId?: string | null;
  organizationId?: string | null;
  userId?: string | null;
  eventId?: string | null;
}

export interface IAuditLogRepository {
  create(data: CreateAuditLogData): Promise<AuditLogEntity>;
  findByOrganization(organizationId: string): Promise<AuditLogEntity[]>;
}
