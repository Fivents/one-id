import type { CreateClientUserRequest, UpdateClientUserRequest } from '@/core/communication/requests/admin';
import type {
  AdminUserListResponse,
  AdminUserResponse,
  ResetPasswordResponse,
} from '@/core/communication/responses/admin';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

class AdminUsersClientService extends BaseClient {
  async listUsers(): Promise<ApiResponse<AdminUserListResponse>> {
    return this.get('/admin/users');
  }

  async createUser(
    data: CreateClientUserRequest,
  ): Promise<ApiResponse<{ user: AdminUserResponse; temporaryPassword: string }>> {
    return this.post('/admin/users', data);
  }

  async updateUser(userId: string, data: UpdateClientUserRequest): Promise<ApiResponse<AdminUserResponse>> {
    return this.patch(`/admin/users/${encodeURIComponent(userId)}`, data);
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return this.delete(`/admin/users/${encodeURIComponent(userId)}`);
  }

  async resetPassword(userId: string): Promise<ApiResponse<ResetPasswordResponse>> {
    return this.post('/admin/users/reset-password', { userId });
  }
}

export const adminUsersClient = new AdminUsersClientService();
