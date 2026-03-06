import type {
  BulkCreateTotemsRequest,
  CreateAdminTotemRequest,
  UpdateAdminTotemRequest,
} from '@/core/communication/requests/admin-totems';
import type { AdminTotemResponse } from '@/core/communication/responses/admin-totems';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

class AdminTotemsClientService extends BaseClient {
  async listTotems(): Promise<ApiResponse<AdminTotemResponse[]>> {
    return this.get('/admin/totems');
  }

  async listDeletedTotems(): Promise<ApiResponse<AdminTotemResponse[]>> {
    return this.get('/admin/totems/deleted');
  }

  async createTotem(data: CreateAdminTotemRequest): Promise<ApiResponse<AdminTotemResponse>> {
    return this.post('/admin/totems', data);
  }

  async bulkCreateTotems(data: BulkCreateTotemsRequest): Promise<ApiResponse<AdminTotemResponse[]>> {
    return this.post('/admin/totems/bulk', data);
  }

  async updateTotem(totemId: string, data: UpdateAdminTotemRequest): Promise<ApiResponse<AdminTotemResponse>> {
    return this.patch(`/admin/totems/${encodeURIComponent(totemId)}`, data);
  }

  async deleteTotem(totemId: string): Promise<ApiResponse<void>> {
    return this.delete(`/admin/totems/${encodeURIComponent(totemId)}`);
  }

  async hardDeleteTotem(totemId: string): Promise<ApiResponse<void>> {
    return this.delete(`/admin/totems/${encodeURIComponent(totemId)}/hard-delete`);
  }

  async restoreTotem(totemId: string): Promise<ApiResponse<AdminTotemResponse>> {
    return this.post(`/admin/totems/${encodeURIComponent(totemId)}/restore`);
  }

  async generateAccessToken(totemId: string): Promise<ApiResponse<AdminTotemResponse>> {
    return this.post(`/admin/totems/${encodeURIComponent(totemId)}/generate-token`);
  }

  async revokeAccessToken(totemId: string): Promise<ApiResponse<AdminTotemResponse>> {
    return this.post(`/admin/totems/${encodeURIComponent(totemId)}/revoke-token`);
  }
}

export const adminTotemsClient = new AdminTotemsClientService();
