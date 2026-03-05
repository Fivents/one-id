import { IPlanRepository, ISubscriptionRepository } from '@/core/domain/contracts';
import type { SubscriptionEntity } from '@/core/domain/entities/subscription.entity';
import { AppError, ErrorCode } from '@/core/errors';

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
      throw new AppError({
        code: ErrorCode.SUBSCRIPTION_NOT_FOUND,
        message: 'Subscription not found.',
        httpStatus: 404,
        level: 'warning',
        context: { organizationId: input.organizationId },
      });
    }

    const newPlan = await this.planRepository.findById(input.newPlanId);
    if (!newPlan) {
      throw new AppError({
        code: ErrorCode.PLAN_NOT_FOUND,
        message: 'Plan not found.',
        httpStatus: 404,
        level: 'warning',
        context: { planId: input.newPlanId },
      });
    }

    if (!newPlan.isAvailable()) {
      throw new AppError({
        code: ErrorCode.PLAN_NOT_AVAILABLE,
        message: 'Plan is not available.',
        httpStatus: 409,
        level: 'warning',
        context: { planId: input.newPlanId },
      });
    }

    if (subscription.planId === input.newPlanId) {
      throw new AppError({
        code: ErrorCode.PLAN_ALREADY_SELECTED,
        message: 'Organization is already on this plan.',
        httpStatus: 409,
        level: 'info',
        context: { planId: input.newPlanId },
      });
    }

    return this.subscriptionRepository.update(subscription.id, {
      planId: input.newPlanId,
    });
  }
}
