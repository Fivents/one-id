import type {
  ISymplaConnectionRepository,
  RecordSyncOutcomeData,
  UpsertSymplaConnectionData,
} from '@/core/domain/contracts';
import { isEncryptedSecret } from '@/core/domain/contracts';
import type { SymplaSyncResult, SymplaSyncStatus } from '@/core/domain/entities';
import { SymplaConnectionEntity } from '@/core/domain/entities';
import { AppError, ErrorCode } from '@/core/errors';
import type { PrismaClient } from '@/generated/prisma/client';
import { Prisma } from '@/generated/prisma/client';

type SymplaConnectionRow = Prisma.SymplaConnectionGetPayload<object>;

export class PrismaSymplaConnectionRepository implements ISymplaConnectionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByOrganizationId(organizationId: string): Promise<SymplaConnectionEntity | null> {
    const row = await this.db.symplaConnection.findUnique({ where: { organizationId } });

    return row ? this.convert(row) : null;
  }

  async upsertByOrganizationId(
    organizationId: string,
    data: UpsertSymplaConnectionData,
  ): Promise<SymplaConnectionEntity> {
    const tokenEncrypted = data.tokenEncrypted as unknown as Prisma.InputJsonValue;

    const row = await this.db.symplaConnection.upsert({
      where: { organizationId },
      create: {
        organizationId,
        tokenEncrypted,
        isActive: data.isActive ?? true,
      },
      update: {
        tokenEncrypted,
        isActive: data.isActive ?? true,
        // A fresh token clears the failure streak; otherwise the reconnect nudge would
        // survive the very action that fixed it.
        consecutiveFailures: 0,
      },
    });

    return this.convert(row);
  }

  async deactivateByOrganizationId(organizationId: string): Promise<SymplaConnectionEntity | null> {
    const existing = await this.db.symplaConnection.findUnique({ where: { organizationId } });
    if (!existing) return null;

    const row = await this.db.symplaConnection.update({
      where: { organizationId },
      data: { isActive: false },
    });

    return this.convert(row);
  }

  async recordSyncOutcome(organizationId: string, data: RecordSyncOutcomeData): Promise<void> {
    const isFailure = data.status === 'FAILED';

    // Prisma distinguishes "leave the column alone" (undefined) from "write SQL NULL"
    // (Prisma.DbNull) on a Json column, so the two cases cannot share a branch.
    const lastSyncResult =
      data.result === undefined
        ? undefined
        : data.result === null
          ? Prisma.DbNull
          : (data.result as unknown as Prisma.InputJsonValue);

    await this.db.symplaConnection.update({
      where: { organizationId },
      data: {
        lastSyncStatus: data.status,
        ...(data.syncedAt ? { lastSyncAt: data.syncedAt } : {}),
        ...(lastSyncResult === undefined ? {} : { lastSyncResult }),
        // A sync that is merely starting must not reset the streak — only its outcome does.
        ...(data.status === 'SYNCING' ? {} : { consecutiveFailures: isFailure ? { increment: 1 } : 0 }),
      },
    });
  }

  async listActive(): Promise<SymplaConnectionEntity[]> {
    const rows = await this.db.symplaConnection.findMany({ where: { isActive: true } });

    return rows.map((row) => this.convert(row));
  }

  private convert(row: SymplaConnectionRow): SymplaConnectionEntity {
    if (!isEncryptedSecret(row.tokenEncrypted)) {
      // Refusing here beats handing a half-broken connection to the sync, which would then
      // fail per-request with a much less obvious error.
      throw new AppError({
        code: ErrorCode.SYMPLA_NOT_CONFIGURED,
        message: 'O token da Sympla armazenado está corrompido. Reconecte a integração.',
        httpStatus: 500,
        level: 'error',
        context: { organizationId: row.organizationId },
      });
    }

    return SymplaConnectionEntity.create({
      id: row.id,
      organizationId: row.organizationId,
      tokenEncrypted: row.tokenEncrypted,
      isActive: row.isActive,
      lastSyncAt: row.lastSyncAt,
      lastSyncStatus: row.lastSyncStatus as SymplaSyncStatus,
      lastSyncResult: (row.lastSyncResult as SymplaSyncResult | null) ?? null,
      consecutiveFailures: row.consecutiveFailures,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
