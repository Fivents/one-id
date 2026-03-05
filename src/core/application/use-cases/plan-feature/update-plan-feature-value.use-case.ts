import { IPlanFeatureRepository } from '@/core/domain/contracts';
import type { PlanFeatureEntity } from '@/core/domain/entities/plan-feature.entity';

export class UpdatePlanFeatureValueUseCase {
  constructor(private readonly planFeatureRepository: IPlanFeatureRepository) {}

  async execute(planId: string, featureId: string, value: string): Promise<PlanFeatureEntity> {
    const planFeature = await this.planFeatureRepository.findByPlanAndFeature(planId, featureId);

    if (!planFeature) {
      throw new UpdatePlanFeatureValueError('Plan-feature association not found.');
    }

    return this.planFeatureRepository.update(planFeature.id, { value });
  }
}

export class UpdatePlanFeatureValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdatePlanFeatureValueError';
  }
}
