import type { CreateUserRequest, UpdateUserRequest } from '@/core/communication/requests/user';
import type { UserResponse } from '@/core/communication/responses/user';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

class UsersClientService extends BaseClient {
  async getUsers(): Promise<ApiResponse<UserResponse[]>> {
    return this.get('/users');
  }

  async getUser(userId: string): Promise<ApiResponse<UserResponse>> {
    return this.get(`/users/${encodeURIComponent(userId)}`);
  }

  async createUser(data: CreateUserRequest): Promise<ApiResponse<UserResponse>> {
    return this.post('/users', data);
  }

  async updateUser(userId: string, data: UpdateUserRequest): Promise<ApiResponse<UserResponse>> {
    return this.patch(`/users/${encodeURIComponent(userId)}`, data);
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return this.delete(`/users/${encodeURIComponent(userId)}`);
  }
}

export const usersClient = new UsersClientService();
