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

export type AssignmentLifecycleStatus = 'ACTIVE' | 'EXPIRED' | 'SCHEDULED' | 'REVOKED';

export interface TotemAssignmentEventHistory {
  id: string;
  eventId: string;
  eventName: string;
  locationName: string;
  startsAt: Date;
  endsAt: Date;
  revokedAt: Date | null;
  revokedReason: string | null;
  status: AssignmentLifecycleStatus;
  eventStatus: string;
}

export interface TotemAssignmentHistory {
  id: string;
  organizationId: string;
  organizationName: string;
  startsAt: Date;
  endsAt: Date;
  revokedAt: Date | null;
  revokedReason: string | null;
  status: AssignmentLifecycleStatus;
  events: TotemAssignmentEventHistory[];
}

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

  async deleteTotem(totemId: string, options?: { force?: boolean }): Promise<ApiResponse<void>> {
    const query = options?.force ? '?force=true' : '';
    return this.delete(`/admin/totems/${encodeURIComponent(totemId)}${query}`);
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

  async assignTotemToOrganization(
    totemId: string,
    data: { organizationId: string; startsAt: Date; endsAt: Date },
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return this.post(`/totems/${encodeURIComponent(totemId)}/assign-organization`, data);
  }

  async unassignTotemFromOrganization(
    totemId: string,
  ): Promise<ApiResponse<{ success: true; endedOrganizationAssignments: number; endedEventAssignments: number }>> {
    return this.post(`/totems/${encodeURIComponent(totemId)}/unassign-organization`, {});
  }

  async getTotemAssignments(totemId: string): Promise<ApiResponse<TotemAssignmentHistory[]>> {
    return this.get(`/totems/${encodeURIComponent(totemId)}/assignments`);
  }

  async removeAssignmentHistory(totemId: string, assignmentId: string): Promise<ApiResponse<{ success: true }>> {
    return this.delete(`/totems/${encodeURIComponent(totemId)}/assignments/${encodeURIComponent(assignmentId)}`);
  }
}

export const adminTotemsClient = new AdminTotemsClientService();
