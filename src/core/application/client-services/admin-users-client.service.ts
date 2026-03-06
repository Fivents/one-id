import type { CreateClientUserRequest, UpdateClientUserRequest } from '@/core/communication/requests/admin';
import type { AdminUserListResponse, AdminUserResponse } from '@/core/communication/responses/admin';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

class AdminUsersClientService extends BaseClient {
  async listUsers(): Promise<ApiResponse<AdminUserListResponse>> {
    return this.get('/admin/users');
  }

  async createUser(data: CreateClientUserRequest): Promise<ApiResponse<{ user: AdminUserResponse }>> {
    return this.post('/admin/users', data);
  }

  async updateUser(userId: string, data: UpdateClientUserRequest): Promise<ApiResponse<AdminUserResponse>> {
    return this.patch(`/admin/users/${encodeURIComponent(userId)}`, data);
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return this.delete(`/admin/users/${encodeURIComponent(userId)}`);
  }

  async resetPassword(userId: string): Promise<ApiResponse<{ success: true }>> {
    return this.post('/admin/users/reset-password', { userId });
  }

  async getUserMemberships(userId: string): Promise<ApiResponse<{ memberships: UserMembershipResponse[] }>> {
    return this.get(`/admin/users/${encodeURIComponent(userId)}/memberships`);
  }

  async addUserMembership(
    userId: string,
    data: { organizationId: string; role: string },
  ): Promise<ApiResponse<{ membership: { id: string; organizationId: string; role: string } }>> {
    return this.post(`/admin/users/${encodeURIComponent(userId)}/memberships`, data);
  }

  async removeUserMembership(userId: string, membershipId: string): Promise<ApiResponse<{ success: true }>> {
    return this.post(`/admin/users/${encodeURIComponent(userId)}/memberships/remove`, { membershipId });
  }

  async updateMembershipRole(
    userId: string,
    data: { membershipId: string; role: string },
  ): Promise<ApiResponse<{ membership: { id: string; organizationId: string; role: string } }>> {
    return this.patch(`/admin/users/${encodeURIComponent(userId)}/memberships`, data);
  }
}

export interface UserMembershipResponse {
  id: string;
  organizationId: string;
  organizationName: string | null;
  role: string;
  createdAt: Date;
}

export const adminUsersClient = new AdminUsersClientService();
