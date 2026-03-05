import { IPlanRepository, ISubscriptionRepository } from '@/core/domain/contracts';
import type { SubscriptionEntity } from '@/core/domain/entities/subscription.entity';

interface ChangePlanInput {
  organizationId: string;
  newPlanId: string;
}

export class ChangePlanUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly planRepository: IPlanRepository,
  ) {}

  async execute(input: ChangePlanInput): Promise<SubscriptionEntity> {
    const subscription = await this.subscriptionRepository.findByOrganization(input.organizationId);

    if (!subscription) {
      throw new ChangePlanError('Subscription not found.');
    }

    const newPlan = await this.planRepository.findById(input.newPlanId);
    if (!newPlan) {
      throw new ChangePlanError('Plan not found.');
    }

    if (!newPlan.isAvailable()) {
      throw new ChangePlanError('Plan is not available.');
    }

    if (subscription.planId === input.newPlanId) {
      throw new ChangePlanError('Organization is already on this plan.');
    }

    return this.subscriptionRepository.update(subscription.id, {
      planId: input.newPlanId,
    });
  }
}

export class ChangePlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChangePlanError';
  }
}
