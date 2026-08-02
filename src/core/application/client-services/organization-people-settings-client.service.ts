import type {
  OrganizationPeopleSettingsResponse,
  UpdateOrganizationPeopleSettingsRequest,
} from '@/core/communication/requests/organization-people-settings';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

export interface AutoLinkEventResponse {
  id: string;
  name: string;
  status: string;
  startsAt: string;
  endsAt: string;
  autoLinkNewPeople: boolean;
}

export interface BackfillPreviewResponse {
  eligibleCount: number;
}

export interface BackfillConfirmResponse {
  processedCount: number;
  remaining: boolean;
  nextCursor: string | null;
}

export type RecalculateTarget = 'accessCode' | 'qrCode';

export interface RecalculatePreviewResponse {
  eligibleCount: number;
}

export interface RecalculateConfirmResponse {
  updatedCount: number;
  remaining: boolean;
  nextCursor: string | null;
}

class OrganizationPeopleSettingsClientService extends BaseClient {
  async getSettings(organizationId: string): Promise<ApiResponse<OrganizationPeopleSettingsResponse>> {
    return this.get(`/organizations/${encodeURIComponent(organizationId)}/people-settings`);
  }

  async updateSettings(
    organizationId: string,
    data: UpdateOrganizationPeopleSettingsRequest,
  ): Promise<ApiResponse<OrganizationPeopleSettingsResponse>> {
    return this.patch(`/organizations/${encodeURIComponent(organizationId)}/people-settings`, data);
  }

  async listAutoLinkEvents(organizationId: string): Promise<ApiResponse<AutoLinkEventResponse[]>> {
    return this.get(`/organizations/${encodeURIComponent(organizationId)}/people-settings/events`);
  }

  async previewEventBackfill(eventId: string): Promise<ApiResponse<BackfillPreviewResponse>> {
    return this.get(`/events/${encodeURIComponent(eventId)}/people-settings/backfill`);
  }

  async confirmEventBackfill(eventId: string, cursor?: string): Promise<ApiResponse<BackfillConfirmResponse>> {
    return this.post(`/events/${encodeURIComponent(eventId)}/people-settings/backfill`, { cursor });
  }

  async previewRecalculate(
    organizationId: string,
    target: RecalculateTarget,
  ): Promise<ApiResponse<RecalculatePreviewResponse>> {
    return this.get(
      `/organizations/${encodeURIComponent(organizationId)}/people-settings/recalculate?target=${target}`,
    );
  }

  async confirmRecalculate(
    organizationId: string,
    target: RecalculateTarget,
    cursor?: string,
  ): Promise<ApiResponse<RecalculateConfirmResponse>> {
    return this.post(`/organizations/${encodeURIComponent(organizationId)}/people-settings/recalculate`, {
      target,
      cursor,
    });
  }
}

export const organizationPeopleSettingsClient = new OrganizationPeopleSettingsClientService();
