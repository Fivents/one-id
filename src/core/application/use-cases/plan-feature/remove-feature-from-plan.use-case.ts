import { IPlanFeatureRepository } from '@/core/domain/contracts';
import { PlanFeatureNotFoundError } from '@/core/errors';

export class RemoveFeatureFromPlanUseCase {
  constructor(private readonly planFeatureRepository: IPlanFeatureRepository) {}

  async execute(planId: string, featureId: string): Promise<void> {
    const planFeature = await this.planFeatureRepository.findByPlanAndFeature(planId, featureId);

    if (!planFeature) {
      throw new PlanFeatureNotFoundError({ planId, featureId });
    }

    await this.planFeatureRepository.softDelete(planFeature.id);
  }
}
