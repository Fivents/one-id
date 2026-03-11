import type {
  BulkCreateTotemsRequest,
  BulkDeleteTotemsRequest,
  ChangeTotemStatusRequest,
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

  async bulkSoftDelete(data: BulkDeleteTotemsRequest): Promise<ApiResponse<void>> {
    return this.post('/admin/totems/bulk-delete', data);
  }

  async hardDeleteTotem(totemId: string): Promise<ApiResponse<void>> {
    return this.delete(`/admin/totems/${encodeURIComponent(totemId)}/hard-delete`);
  }

  async bulkHardDelete(data: BulkDeleteTotemsRequest): Promise<ApiResponse<void>> {
    return this.post('/admin/totems/bulk-hard-delete', data);
  }

  async restoreTotem(totemId: string): Promise<ApiResponse<AdminTotemResponse>> {
    return this.post(`/admin/totems/${encodeURIComponent(totemId)}/restore`);
  }

  async generateAccessCode(totemId: string): Promise<ApiResponse<AdminTotemResponse>> {
    return this.post(`/admin/totems/${encodeURIComponent(totemId)}/generate-code`);
  }

  async revokeAccessCode(totemId: string): Promise<ApiResponse<AdminTotemResponse>> {
    return this.post(`/admin/totems/${encodeURIComponent(totemId)}/revoke-code`);
  }

  async changeStatus(totemId: string, data: ChangeTotemStatusRequest): Promise<ApiResponse<AdminTotemResponse>> {
    return this.patch(`/admin/totems/${encodeURIComponent(totemId)}/status`, data);
  }
}

export const adminTotemsClient = new AdminTotemsClientService();
