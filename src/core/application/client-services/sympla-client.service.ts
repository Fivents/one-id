import type { ConnectSymplaRequest } from '@/core/communication/requests/sympla';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

export interface SymplaSyncError {
  type: string;
  message: string;
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

/**
 * The connected/disconnected split is a discriminated union so the settings page cannot read
 * sync fields off a connection that does not exist.
 */
export type SymplaConnectionStatusResponse =
  | { connected: false }
  | {
      connected: true;
      id: string;
      organizationId: string;
      isActive: boolean;
      lastSyncAt: string | null;
      lastSyncStatus: 'IDLE' | 'SYNCING' | 'COMPLETED' | 'FAILED';
      lastSyncResult: SymplaSyncResult | null;
      consecutiveFailures: number;
      needsAttention: boolean;
      createdAt: string;
      updatedAt: string;
    };

class SymplaClientService extends BaseClient {
  async getStatus(organizationId: string): Promise<ApiResponse<SymplaConnectionStatusResponse>> {
    return this.get(`/organizations/${encodeURIComponent(organizationId)}/integrations/sympla`);
  }

  async connect(
    organizationId: string,
    data: ConnectSymplaRequest,
  ): Promise<ApiResponse<SymplaConnectionStatusResponse>> {
    return this.post(`/organizations/${encodeURIComponent(organizationId)}/integrations/sympla`, data);
  }

  async disconnect(organizationId: string): Promise<ApiResponse<void>> {
    return this.delete(`/organizations/${encodeURIComponent(organizationId)}/integrations/sympla`);
  }
}

export const symplaClient = new SymplaClientService();
