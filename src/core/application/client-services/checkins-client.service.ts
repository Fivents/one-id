import type { RegisterCheckInRequest } from '@/core/communication/requests/check-in';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

export interface CheckInResponse {
  id: string;
  method: string;
  confidence: number | null;
  eventParticipantId: string;
  totemEventSubscriptionId: string;
  checkedInAt: Date;
}

class CheckinsClientService extends BaseClient {
  async performCheckin(data: RegisterCheckInRequest): Promise<ApiResponse<CheckInResponse>> {
    return this.post('/check-in', data);
  }

  async performCheckout(data: {
    eventParticipantId: string;
    totemEventSubscriptionId: string;
  }): Promise<ApiResponse<{ id: string }>> {
    return this.post('/check-out', data);
  }

  async listCheckins(eventId: string): Promise<ApiResponse<CheckInResponse[]>> {
    return this.get(`/check-in/event/${encodeURIComponent(eventId)}`);
  }
}

export const checkinsClient = new CheckinsClientService();
