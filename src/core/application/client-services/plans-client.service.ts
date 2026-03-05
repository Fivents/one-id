import type { CreatePlanRequest, UpdatePlanRequest } from '@/core/communication/requests/plan';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

export interface PlanResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  isCustom: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

class PlansClientService extends BaseClient {
  async getPlans(): Promise<ApiResponse<PlanResponse[]>> {
    return this.get('/plans');
  }

  async createPlan(data: CreatePlanRequest): Promise<ApiResponse<PlanResponse>> {
    return this.post('/plans', data);
  }

  async updatePlan(planId: string, data: UpdatePlanRequest): Promise<ApiResponse<PlanResponse>> {
    return this.patch(`/plans/${encodeURIComponent(planId)}`, data);
  }

  async deletePlan(planId: string): Promise<ApiResponse<void>> {
    return this.delete(`/plans/${encodeURIComponent(planId)}`);
  }
}

export const plansClient = new PlansClientService();
