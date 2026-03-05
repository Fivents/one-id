import { IPlanFeatureRepository } from '@/core/domain/contracts';
import type { PlanFeatureEntity } from '@/core/domain/entities/plan-feature.entity';
import { PlanFeatureNotFoundError } from '@/core/errors';

export class UpdatePlanFeatureValueUseCase {
  constructor(private readonly planFeatureRepository: IPlanFeatureRepository) {}

  async execute(planId: string, featureId: string, value: string): Promise<PlanFeatureEntity> {
    const planFeature = await this.planFeatureRepository.findByPlanAndFeature(planId, featureId);

    if (!planFeature) {
      throw new PlanFeatureNotFoundError({ planId, featureId });
    }

    return this.planFeatureRepository.update(planFeature.id, { value });
  }
}
