import type { CreateTotemRequest, UpdateTotemRequest } from '@/core/communication/requests/totem';
import type { TotemResponse } from '@/core/communication/responses/totem';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

export interface TotemOrganizationAssignmentResponse {
  id: string;
  totemId: string;
  organizationId: string;
  organizationName: string;
  startsAt: Date;
  endsAt: Date;
}

export interface TotemAssignmentHistoryResponse {
  id: string;
  organizationId: string;
  organizationName: string;
  startsAt: Date;
  endsAt: Date;
  events: {
    id: string;
    eventId: string;
    eventName: string;
    locationName: string;
    startsAt: Date;
    endsAt: Date;
    eventStatus: string;
  }[];
}

class TotemsClientService extends BaseClient {
  async listTotems(): Promise<ApiResponse<TotemResponse[]>> {
    return this.get('/totems');
  }

  async getTotem(totemId: string): Promise<ApiResponse<TotemResponse>> {
    return this.get(`/totems/${encodeURIComponent(totemId)}`);
  }

  async createTotem(data: CreateTotemRequest): Promise<ApiResponse<TotemResponse>> {
    return this.post('/totems', data);
  }

  async updateTotem(totemId: string, data: UpdateTotemRequest): Promise<ApiResponse<TotemResponse>> {
    return this.patch(`/totems/${encodeURIComponent(totemId)}`, data);
  }

  async deleteTotem(totemId: string): Promise<ApiResponse<void>> {
    return this.delete(`/totems/${encodeURIComponent(totemId)}`);
  }

  async assignTotemToOrganization(
    totemId: string,
    data: { organizationId: string; startsAt: Date; endsAt: Date },
  ): Promise<ApiResponse<TotemOrganizationAssignmentResponse>> {
    return this.post(`/totems/${encodeURIComponent(totemId)}/assign-organization`, data);
  }

  async unassignTotemFromOrganization(
    totemId: string,
  ): Promise<ApiResponse<{ success: true; endedOrganizationAssignments: number; endedEventAssignments: number }>> {
    return this.post(`/totems/${encodeURIComponent(totemId)}/unassign-organization`, {});
  }

  async getTotemAssignments(totemId: string): Promise<ApiResponse<TotemAssignmentHistoryResponse[]>> {
    return this.get(`/totems/${encodeURIComponent(totemId)}/assignments`);
  }
}

export const totemsClient = new TotemsClientService();
