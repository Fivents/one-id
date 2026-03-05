import { IPlanFeatureRepository } from '@/core/domain/contracts';
import type { PlanFeatureEntity } from '@/core/domain/entities/plan-feature.entity';

export class ListPlanFeaturesUseCase {
  constructor(private readonly planFeatureRepository: IPlanFeatureRepository) {}

  async execute(planId: string): Promise<PlanFeatureEntity[]> {
    return this.planFeatureRepository.findByPlan(planId);
  }
}
