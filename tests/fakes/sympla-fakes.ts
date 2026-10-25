import { randomUUID } from 'node:crypto';

import type {
  CreateAuditLogData,
  EncryptedSecret,
  IAuditLogRepository,
  ISecretCipher,
  ISymplaConnectionRepository,
  RecordSyncOutcomeData,
  UpsertSymplaConnectionData,
} from '@/core/domain/contracts';
import type { AuditLogEntity } from '@/core/domain/entities';
import { SymplaConnectionEntity } from '@/core/domain/entities';

/** Reversible, not secure — the point is to assert what gets stored, not to encrypt. */
export class FakeSecretCipher implements ISecretCipher {
  encrypt(plaintext: string): EncryptedSecret {
    return {
      version: 1,
      iv: 'iv',
      ciphertext: Buffer.from(plaintext, 'utf8').toString('base64'),
      authTag: 'tag',
    };
  }

  decrypt(secret: EncryptedSecret): string {
    return Buffer.from(secret.ciphertext, 'base64').toString('utf8');
  }

  addAlternateKey(): void {}

  getCurrentKeyVersion(): number {
    return 1;
  }
}

export class InMemorySymplaConnectionRepository implements ISymplaConnectionRepository {
  private readonly byOrganization = new Map<string, SymplaConnectionEntity>();

  async findByOrganizationId(organizationId: string): Promise<SymplaConnectionEntity | null> {
    return this.byOrganization.get(organizationId) ?? null;
  }

  async upsertByOrganizationId(
    organizationId: string,
    data: UpsertSymplaConnectionData,
  ): Promise<SymplaConnectionEntity> {
    const existing = this.byOrganization.get(organizationId);
    const now = new Date();

    const connection = SymplaConnectionEntity.create({
      id: existing?.id ?? randomUUID(),
      organizationId,
      tokenEncrypted: data.tokenEncrypted,
      isActive: data.isActive ?? true,
      lastSyncAt: existing?.lastSyncAt ?? null,
      lastSyncStatus: existing?.lastSyncStatus ?? 'IDLE',
      lastSyncResult: existing?.lastSyncResult ?? null,
      consecutiveFailures: 0,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });

    this.byOrganization.set(organizationId, connection);
    return connection;
  }

  async deactivateByOrganizationId(organizationId: string): Promise<SymplaConnectionEntity | null> {
    const existing = this.byOrganization.get(organizationId);
    if (!existing) return null;

    const deactivated = SymplaConnectionEntity.create({
      id: existing.id,
      organizationId,
      tokenEncrypted: existing.tokenEncrypted,
      isActive: false,
      lastSyncAt: existing.lastSyncAt,
      lastSyncStatus: existing.lastSyncStatus,
      lastSyncResult: existing.lastSyncResult,
      consecutiveFailures: existing.consecutiveFailures,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    this.byOrganization.set(organizationId, deactivated);
    return deactivated;
  }

  async recordSyncOutcome(organizationId: string, data: RecordSyncOutcomeData): Promise<void> {
    const existing = this.byOrganization.get(organizationId);
    if (!existing) return;

    this.byOrganization.set(
      organizationId,
      SymplaConnectionEntity.create({
        id: existing.id,
        organizationId,
        tokenEncrypted: existing.tokenEncrypted,
        isActive: existing.isActive,
        lastSyncAt: data.syncedAt ?? existing.lastSyncAt,
        lastSyncStatus: data.status,
        lastSyncResult: data.result === undefined ? existing.lastSyncResult : data.result,
        consecutiveFailures:
          data.status === 'SYNCING'
            ? existing.consecutiveFailures
            : data.status === 'FAILED'
              ? existing.consecutiveFailures + 1
              : 0,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
      }),
    );
  }

  async listActive(): Promise<SymplaConnectionEntity[]> {
    return [...this.byOrganization.values()].filter((connection) => connection.isActive);
  }
}

export class InMemoryAuditLogRepository implements IAuditLogRepository {
  readonly entries: CreateAuditLogData[] = [];

  async create(data: CreateAuditLogData): Promise<AuditLogEntity> {
    this.entries.push(data);
    return { id: randomUUID(), ...data } as unknown as AuditLogEntity;
  }

  async findById(): Promise<AuditLogEntity | null> {
    return null;
  }

  async findByOrganization(): Promise<AuditLogEntity[]> {
    return [];
  }

  async findByUser(): Promise<AuditLogEntity[]> {
    return [];
  }

  async findByEntity(): Promise<AuditLogEntity[]> {
    return [];
  }
}
