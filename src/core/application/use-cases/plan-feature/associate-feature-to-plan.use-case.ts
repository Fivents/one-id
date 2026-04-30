import { IFeatureRepository, IPlanFeatureRepository, IPlanRepository } from '@/core/domain/contracts';
import type { PlanFeatureEntity } from '@/core/domain/entities/plan-feature.entity';
import { FeatureNotFoundError, PlanFeatureAlreadyExistsError, PlanNotFoundError } from '@/core/errors';

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
      throw new PlanNotFoundError(input.planId);
    }

    const feature = await this.featureRepository.findById(input.featureId);
    if (!feature) {
      throw new FeatureNotFoundError(input.featureId);
    }

    const existing = await this.planFeatureRepository.findByPlanAndFeature(input.planId, input.featureId);
    if (existing) {
      throw new PlanFeatureAlreadyExistsError(input.planId, input.featureId);
    }

    return this.planFeatureRepository.create({
      planId: input.planId,
      featureId: input.featureId,
      value: input.value,
    });
  }
}
