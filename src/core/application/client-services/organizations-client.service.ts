import type { CreateOrganizationRequest, UpdateOrganizationRequest } from '@/core/communication/requests/organization';
import type { OrganizationResponse } from '@/core/communication/responses/organization';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

class OrganizationsClientService extends BaseClient {
  async listOrganizations(): Promise<ApiResponse<OrganizationResponse[]>> {
    return this.get('/organizations');
  }

  async getOrganization(organizationId: string): Promise<ApiResponse<OrganizationResponse>> {
    return this.get(`/organizations/${encodeURIComponent(organizationId)}`);
  }

  async createOrganization(data: CreateOrganizationRequest): Promise<ApiResponse<OrganizationResponse>> {
    return this.post('/organizations', data);
  }

  async updateOrganization(
    organizationId: string,
    data: UpdateOrganizationRequest,
  ): Promise<ApiResponse<OrganizationResponse>> {
    return this.patch(`/organizations/${encodeURIComponent(organizationId)}`, data);
  }
}

export const organizationsClient = new OrganizationsClientService();
