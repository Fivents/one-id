import { IPlanFeatureRepository } from '@/core/domain/contracts';

export class RemoveFeatureFromPlanUseCase {
  constructor(private readonly planFeatureRepository: IPlanFeatureRepository) {}

  async execute(planId: string, featureId: string): Promise<void> {
    const planFeature = await this.planFeatureRepository.findByPlanAndFeature(planId, featureId);

    if (!planFeature) {
      throw new RemoveFeatureFromPlanError('Feature is not associated with this plan.');
    }

    await this.planFeatureRepository.softDelete(planFeature.id);
  }
}

export class RemoveFeatureFromPlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RemoveFeatureFromPlanError';
  }
}
