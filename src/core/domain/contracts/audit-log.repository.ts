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
  findById(id: string): Promise<AuditLogEntity | null>;
  findByOrganization(organizationId: string): Promise<AuditLogEntity[]>;
  findByUser(userId: string): Promise<AuditLogEntity[]>;
  findByEntity(entityType: string, entityId: string): Promise<AuditLogEntity[]>;
}
