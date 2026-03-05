import { IFeatureRepository, IPlanFeatureRepository, ISubscriptionRepository } from '@/core/domain/contracts';

export class PlanLimitValidationService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly planFeatureRepository: IPlanFeatureRepository,
    private readonly featureRepository: IFeatureRepository,
  ) {}

  async validateFeatureLimit(
    organizationId: string,
    featureCode: string,
    currentUsage: number,
  ): Promise<{ allowed: boolean; limit: number; remaining: number }> {
    const subscription = await this.subscriptionRepository.findByOrganization(organizationId);

    if (!subscription) {
      throw new PlanLimitValidationError('Organization does not have an active subscription.');
    }

    if (!subscription.isActive()) {
      throw new PlanLimitValidationError('Subscription is not active.');
    }

    const feature = await this.featureRepository.findByCode(featureCode);
    if (!feature) {
      throw new PlanLimitValidationError(`Feature "${featureCode}" not found.`);
    }

    const planFeature = await this.planFeatureRepository.findByPlanAndFeature(subscription.planId, feature.id);

    if (!planFeature) {
      return { allowed: false, limit: 0, remaining: 0 };
    }

    if (feature.isBooleanType()) {
      const enabled = planFeature.booleanValue();
      return { allowed: enabled, limit: enabled ? Infinity : 0, remaining: enabled ? Infinity : 0 };
    }

    const limit = planFeature.numberValue();
    const remaining = Math.max(0, limit - currentUsage);

    return { allowed: remaining > 0, limit, remaining };
  }

  async isFeatureEnabled(organizationId: string, featureCode: string): Promise<boolean> {
    const result = await this.validateFeatureLimit(organizationId, featureCode, 0);
    return result.allowed;
  }
}

export class PlanLimitValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanLimitValidationError';
  }
}
