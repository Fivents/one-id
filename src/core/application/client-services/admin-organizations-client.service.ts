import type { CreateOrganizationRequest, UpdateOrganizationRequest } from '@/core/communication/requests/organization';
import type {
  AdminOrganizationDetailResponse,
  AdminOrganizationResponse,
  AdminOrganizationSubscriptionResponse,
} from '@/core/communication/responses/admin-organizations';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';
import type { PlanResponse } from './plans-client.service';

export interface AddMemberRequest {
  name: string;
  email: string;
  role: 'ORG_OWNER' | 'EVENT_MANAGER';
}

class AdminOrganizationsClientService extends BaseClient {
  async listOrganizations(): Promise<ApiResponse<AdminOrganizationResponse[]>> {
    return this.get('/admin/organizations');
  }

  async getOrganization(organizationId: string): Promise<ApiResponse<AdminOrganizationDetailResponse>> {
    return this.get(`/admin/organizations/${encodeURIComponent(organizationId)}`);
  }

  async createOrganization(data: CreateOrganizationRequest): Promise<ApiResponse<AdminOrganizationResponse>> {
    return this.post('/admin/organizations', data);
  }

  async updateOrganization(
    organizationId: string,
    data: UpdateOrganizationRequest,
  ): Promise<ApiResponse<AdminOrganizationResponse>> {
    return this.patch(`/admin/organizations/${encodeURIComponent(organizationId)}`, data);
  }

  async toggleStatus(organizationId: string, isActive: boolean): Promise<ApiResponse<AdminOrganizationResponse>> {
    return this.patch(`/admin/organizations/${encodeURIComponent(organizationId)}/status`, { isActive });
  }

  async deleteOrganization(organizationId: string): Promise<ApiResponse<void>> {
    return this.delete(`/admin/organizations/${encodeURIComponent(organizationId)}`);
  }

  async assignSubscription(
    organizationId: string,
    data: { planId: string; startedAt: string; expiresAt: string },
  ): Promise<ApiResponse<AdminOrganizationSubscriptionResponse>> {
    return this.post(`/admin/organizations/${encodeURIComponent(organizationId)}/subscription`, data);
  }

  async addMember(
    organizationId: string,
    data: AddMemberRequest,
  ): Promise<ApiResponse<{ user: { id: string; name: string; email: string } }>> {
    return this.post(`/admin/organizations/${encodeURIComponent(organizationId)}/members`, data);
  }

  async getAvailablePlans(): Promise<ApiResponse<PlanResponse[]>> {
    return this.get('/admin/plans');
  }
}

export const adminOrganizationsClient = new AdminOrganizationsClientService();
