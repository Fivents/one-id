import type { CreateTotemRequest, UpdateTotemRequest } from '@/core/communication/requests/totem';
import type { TotemResponse } from '@/core/communication/responses/totem';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

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
}

export const totemsClient = new TotemsClientService();
