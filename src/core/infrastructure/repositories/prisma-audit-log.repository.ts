import type { InputJsonValue } from '@prisma/client/runtime/client';

import type { CreateAuditLogData, IAuditLogRepository } from '@/core/domain/contracts';
import { type AuditAction, AuditLogEntity } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateAuditLogData): Promise<AuditLogEntity> {
    const log = await this.db.auditLog.create({
      data: {
        action: data.action,
        description: data.description,
        metadata: (data.metadata as InputJsonValue) ?? undefined,
        sessionId: data.sessionId,
        organizationId: data.organizationId,
        userId: data.userId,
        eventId: data.eventId,
      },
    });

    return AuditLogEntity.create({
      id: log.id,
      action: log.action as AuditAction,
      description: log.description,
      metadata: log.metadata as Record<string, unknown> | null,
      sessionId: log.sessionId,
      organizationId: log.organizationId,
      userId: log.userId,
      eventId: log.eventId,
      createdAt: log.createdAt,
    });
  }

  async findByOrganization(organizationId: string): Promise<AuditLogEntity[]> {
    const logs = await this.db.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) =>
      AuditLogEntity.create({
        id: log.id,
        action: log.action as AuditAction,
        description: log.description,
        metadata: log.metadata as Record<string, unknown> | null,
        sessionId: log.sessionId,
        organizationId: log.organizationId,
        userId: log.userId,
        eventId: log.eventId,
        createdAt: log.createdAt,
      }),
    );
  }
}
