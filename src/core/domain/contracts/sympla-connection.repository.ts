import type {
  SymplaConnectionEntity,
  SymplaSyncResult,
  SymplaSyncStatus,
} from '../entities/sympla-connection.entity';

import type { EncryptedSecret } from './secret-cipher.service';

export interface UpsertSymplaConnectionData {
  tokenEncrypted: EncryptedSecret;
  isActive?: boolean;
}

export interface RecordSyncOutcomeData {
  status: SymplaSyncStatus;
  result?: SymplaSyncResult | null;
  syncedAt?: Date;
}

export interface ISymplaConnectionRepository {
  findByOrganizationId(organizationId: string): Promise<SymplaConnectionEntity | null>;
  upsertByOrganizationId(
    organizationId: string,
    data: UpsertSymplaConnectionData,
  ): Promise<SymplaConnectionEntity>;
  deactivateByOrganizationId(organizationId: string): Promise<SymplaConnectionEntity | null>;
  recordSyncOutcome(organizationId: string, data: RecordSyncOutcomeData): Promise<void>;
  /** Active connections, for the scheduler to fan out over. */
  listActive(): Promise<SymplaConnectionEntity[]>;
}
