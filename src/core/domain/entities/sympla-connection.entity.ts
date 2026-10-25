import { randomUUID } from 'node:crypto';

import type { EncryptedSecret } from '../contracts/secret-cipher.service';

import { BaseEntity } from './base.entity';

export type SymplaSyncStatus = 'IDLE' | 'SYNCING' | 'COMPLETED' | 'FAILED';

export interface SymplaSyncError {
  type: string;
  message: string;
  /** Ticket number, order sk or event hash — whatever identifies the offending record. */
  ref?: string;
}

export interface SymplaSyncResult {
  eventsSynced: number;
  presentationsSynced: number;
  ordersSynced: number;
  participantsSynced: number;
  errors: SymplaSyncError[];
  durationMs: number;
  startedAt: string;
  finishedAt: string;
}

export interface SymplaConnectionProps {
  id: string;
  organizationId: string;
  tokenEncrypted: EncryptedSecret;
  isActive: boolean;
  lastSyncAt: Date | null;
  lastSyncStatus: SymplaSyncStatus;
  lastSyncResult: SymplaSyncResult | null;
  consecutiveFailures: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Past this many consecutive failures the UI nudges the organizer to reconnect. */
export const SYMPLA_FAILURE_ALERT_THRESHOLD = 3;

export class SymplaConnectionEntity extends BaseEntity {
  private constructor(private readonly props: SymplaConnectionProps) {
    super(props.id);
  }

  static create(props: SymplaConnectionProps): SymplaConnectionEntity {
    return new SymplaConnectionEntity(props);
  }

  static newConnection(organizationId: string, tokenEncrypted: EncryptedSecret): SymplaConnectionEntity {
    const now = new Date();

    return new SymplaConnectionEntity({
      id: randomUUID(),
      organizationId,
      tokenEncrypted,
      isActive: true,
      lastSyncAt: null,
      lastSyncStatus: 'IDLE',
      lastSyncResult: null,
      consecutiveFailures: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  /** Internal use only — never route this into a response. */
  get tokenEncrypted(): EncryptedSecret {
    return this.props.tokenEncrypted;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get lastSyncAt(): Date | null {
    return this.props.lastSyncAt;
  }

  get lastSyncStatus(): SymplaSyncStatus {
    return this.props.lastSyncStatus;
  }

  get lastSyncResult(): SymplaSyncResult | null {
    return this.props.lastSyncResult;
  }

  get consecutiveFailures(): number {
    return this.props.consecutiveFailures;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  needsAttention(): boolean {
    return this.props.consecutiveFailures >= SYMPLA_FAILURE_ALERT_THRESHOLD;
  }

  isUsable(): boolean {
    return this.props.isActive;
  }

  /**
   * Intentionally omits tokenEncrypted. Controllers return entity.toJSON() verbatim, so the
   * only reliable way to keep the credential out of an HTTP response is to keep it out of here.
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      organizationId: this.props.organizationId,
      isActive: this.props.isActive,
      lastSyncAt: this.props.lastSyncAt,
      lastSyncStatus: this.props.lastSyncStatus,
      lastSyncResult: this.props.lastSyncResult,
      consecutiveFailures: this.props.consecutiveFailures,
      needsAttention: this.needsAttention(),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
