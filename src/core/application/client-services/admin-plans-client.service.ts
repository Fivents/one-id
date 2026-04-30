import type { CreateFeatureRequest, UpdateFeatureRequest } from '@/core/communication/requests/feature';
import type { CreatePlanRequest, UpdatePlanRequest } from '@/core/communication/requests/plan';
import type { CreatePlanCategoryRequest, UpdatePlanCategoryRequest } from '@/core/communication/requests/plan-category';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

// ── Response types ─────────────────────────────────────────────────

export interface AdminPlanCategoryResponse {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  _count: { plans: number };
}

export interface AdminPlanResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  isCustom: boolean;
  isActive: boolean;
  sortOrder: number;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string; color: string } | null;
  _count: { planFeatures: number; subscriptions: number };
}

export interface AdminFeatureResponse {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { planFeatures: number };
}

export interface AdminPlanFeatureResponse {
  id: string;
  value: string;
  featureId: string;
  feature: { id: string; code: string; name: string; type: string };
}

// ── Client ─────────────────────────────────────────────────────────

class AdminPlansClientService extends BaseClient {
  // Plans
  async listPlans(): Promise<ApiResponse<AdminPlanResponse[]>> {
    return this.get('/admin/plans');
  }

  async getPlan(
    planId: string,
  ): Promise<ApiResponse<AdminPlanResponse & { planFeatures: AdminPlanFeatureResponse[] }>> {
    return this.get(`/admin/plans/${encodeURIComponent(planId)}`);
  }

  async createPlan(data: CreatePlanRequest): Promise<ApiResponse<AdminPlanResponse>> {
    return this.post('/admin/plans', data);
  }

  async updatePlan(planId: string, data: UpdatePlanRequest): Promise<ApiResponse<AdminPlanResponse>> {
    return this.patch(`/admin/plans/${encodeURIComponent(planId)}`, data);
  }

  async deletePlan(planId: string): Promise<ApiResponse<void>> {
    return this.delete(`/admin/plans/${encodeURIComponent(planId)}`);
  }

  async updatePlanFeatures(
    planId: string,
    features: { featureId: string; value: string }[],
  ): Promise<ApiResponse<AdminPlanFeatureResponse[]>> {
    return this.post(`/admin/plans/${encodeURIComponent(planId)}/features`, { planId, features });
  }

  // Categories
  async listCategories(): Promise<ApiResponse<AdminPlanCategoryResponse[]>> {
    return this.get('/admin/plan-categories');
  }

  async createCategory(data: CreatePlanCategoryRequest): Promise<ApiResponse<AdminPlanCategoryResponse>> {
    return this.post('/admin/plan-categories', data);
  }

  async updateCategory(
    categoryId: string,
    data: UpdatePlanCategoryRequest,
  ): Promise<ApiResponse<AdminPlanCategoryResponse>> {
    return this.patch(`/admin/plan-categories/${encodeURIComponent(categoryId)}`, data);
  }

  async deleteCategory(categoryId: string): Promise<ApiResponse<void>> {
    return this.delete(`/admin/plan-categories/${encodeURIComponent(categoryId)}`);
  }

  // Features
  async listFeatures(): Promise<ApiResponse<AdminFeatureResponse[]>> {
    return this.get('/admin/features');
  }

  async createFeature(data: CreateFeatureRequest): Promise<ApiResponse<AdminFeatureResponse>> {
    return this.post('/admin/features', data);
  }

  async updateFeature(featureId: string, data: UpdateFeatureRequest): Promise<ApiResponse<AdminFeatureResponse>> {
    return this.patch(`/admin/features/${encodeURIComponent(featureId)}`, data);
  }

  async deleteFeature(featureId: string): Promise<ApiResponse<void>> {
    return this.delete(`/admin/features/${encodeURIComponent(featureId)}`);
  }
}

export const adminPlansClient = new AdminPlansClientService();
