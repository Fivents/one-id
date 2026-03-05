import { IFeatureRepository, IPlanFeatureRepository, IPlanRepository } from '@/core/domain/contracts';
import type { PlanFeatureEntity } from '@/core/domain/entities/plan-feature.entity';

interface AssociateFeatureToPlanInput {
  planId: string;
  featureId: string;
  value: string;
}

export class AssociateFeatureToPlanUseCase {
  constructor(
    private readonly planFeatureRepository: IPlanFeatureRepository,
    private readonly planRepository: IPlanRepository,
    private readonly featureRepository: IFeatureRepository,
  ) {}

  async execute(input: AssociateFeatureToPlanInput): Promise<PlanFeatureEntity> {
    const plan = await this.planRepository.findById(input.planId);
    if (!plan) {
      throw new AssociateFeatureToPlanError('Plan not found.');
    }

    const feature = await this.featureRepository.findById(input.featureId);
    if (!feature) {
      throw new AssociateFeatureToPlanError('Feature not found.');
    }

    const existing = await this.planFeatureRepository.findByPlanAndFeature(input.planId, input.featureId);
    if (existing) {
      throw new AssociateFeatureToPlanError('Feature is already associated with this plan.');
    }

    return this.planFeatureRepository.create({
      planId: input.planId,
      featureId: input.featureId,
      value: input.value,
    });
  }
}

export class AssociateFeatureToPlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssociateFeatureToPlanError';
  }
}
