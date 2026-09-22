import type { ConnectSymplaRequest, LinkEventToSymplaRequest } from '@/core/communication/requests/sympla';

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

export interface SymplaEventOptionResponse {
  symplaEventIdHash: string;
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  imageUrl: string | null;
  url: string | null;
  published: boolean;
  cancelled: boolean;
  linkedEventId: string | null;
}

export type SymplaEventLinkResponse =
  | { linked: false }
  | {
      linked: true;
      id: string;
      eventId: string;
      symplaEventIdHash: string;
      symplaUrl: string | null;
      imageUrl: string | null;
      hostName: string | null;
      publishedOnSympla: boolean;
      cancelledOnSympla: boolean;
      lastSeedAt: string | null;
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

  async listSymplaEvents(
    organizationId: string,
  ): Promise<ApiResponse<{ items: SymplaEventOptionResponse[] }>> {
    return this.get(`/organizations/${encodeURIComponent(organizationId)}/integrations/sympla/events`);
  }

  async getEventLink(eventId: string): Promise<ApiResponse<SymplaEventLinkResponse>> {
    return this.get(`/events/${encodeURIComponent(eventId)}/sympla/link`);
  }

  async linkEvent(eventId: string, data: LinkEventToSymplaRequest): Promise<ApiResponse<unknown>> {
    return this.post(`/events/${encodeURIComponent(eventId)}/sympla/link`, data);
  }

  async unlinkEvent(eventId: string): Promise<ApiResponse<void>> {
    return this.delete(`/events/${encodeURIComponent(eventId)}/sympla/link`);
  }

  async syncEvent(
    eventId: string,
  ): Promise<ApiResponse<{ enqueued: boolean; alreadyRunning: boolean }>> {
    return this.post(`/events/${encodeURIComponent(eventId)}/sympla/sync`, {});
  }
}

export const symplaClient = new SymplaClientService();
