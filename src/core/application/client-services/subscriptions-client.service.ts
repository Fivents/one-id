import type {
  ChangePlanRequest,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from '@/core/communication/requests/subscription';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

export interface SubscriptionResponse {
  id: string;
  organizationId: string;
  planId: string;
  startedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

class SubscriptionsClientService extends BaseClient {
  async getSubscription(organizationId: string): Promise<ApiResponse<SubscriptionResponse>> {
    return this.get(`/subscriptions?organizationId=${encodeURIComponent(organizationId)}`);
  }

  async createSubscription(data: CreateSubscriptionRequest): Promise<ApiResponse<SubscriptionResponse>> {
    return this.post('/subscriptions', data);
  }

  async updateSubscription(
    subscriptionId: string,
    data: UpdateSubscriptionRequest,
  ): Promise<ApiResponse<SubscriptionResponse>> {
    return this.patch(`/subscriptions/${encodeURIComponent(subscriptionId)}`, data);
  }

  async changePlan(data: ChangePlanRequest): Promise<ApiResponse<SubscriptionResponse>> {
    return this.post('/subscriptions/change-plan', data);
  }

  async requestPlanChange(data: {
    organizationId: string;
    requestedPlanId: string;
    message: string;
  }): Promise<ApiResponse<{ id: string }>> {
    return this.post('/plan-change-requests', data);
  }
}

export const subscriptionsClient = new SubscriptionsClientService();
