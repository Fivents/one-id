import type { PlanFeatureEntity } from '../entities/plan-feature.entity';

export interface CreatePlanFeatureData {
  value: string;
  featureId: string;
  planId: string;
}

export interface IPlanFeatureRepository {
  findByPlan(planId: string): Promise<PlanFeatureEntity[]>;
  findByPlanAndFeature(planId: string, featureId: string): Promise<PlanFeatureEntity | null>;
  create(data: CreatePlanFeatureData): Promise<PlanFeatureEntity>;
  update(id: string, data: { value: string }): Promise<PlanFeatureEntity>;
  softDelete(id: string): Promise<void>;
}
