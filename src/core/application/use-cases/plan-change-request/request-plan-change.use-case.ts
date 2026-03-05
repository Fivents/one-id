import { IPlanChangeRequestRepository, IPlanRepository, ISubscriptionRepository } from '@/core/domain/contracts';
import type { PlanChangeRequestEntity } from '@/core/domain/entities/plan-change-request.entity';
import {
  PlanAlreadySelectedError,
  PlanChangeRequestPendingError,
  PlanNotFoundError,
  SubscriptionNotFoundError,
} from '@/core/errors';

interface RequestPlanChangeInput {
  organizationId: string;
  requestedPlanId: string;
  message: string;
}

export class RequestPlanChangeUseCase {
  constructor(
    private readonly planChangeRequestRepository: IPlanChangeRequestRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly planRepository: IPlanRepository,
  ) {}

  async execute(input: RequestPlanChangeInput): Promise<PlanChangeRequestEntity> {
    const subscription = await this.subscriptionRepository.findByOrganization(input.organizationId);
    if (!subscription) {
      throw new SubscriptionNotFoundError({ organizationId: input.organizationId });
    }

    const requestedPlan = await this.planRepository.findById(input.requestedPlanId);
    if (!requestedPlan) {
      throw new PlanNotFoundError(input.requestedPlanId);
    }

    if (subscription.planId === input.requestedPlanId) {
      throw new PlanAlreadySelectedError(input.requestedPlanId);
    }

    const pendingRequests = await this.planChangeRequestRepository.findPendingByOrganization(input.organizationId);
    if (pendingRequests.length > 0) {
      throw new PlanChangeRequestPendingError(input.organizationId);
    }

    return this.planChangeRequestRepository.create({
      message: input.message,
      organizationId: input.organizationId,
      currentPlanId: subscription.planId,
      requestedPlanId: input.requestedPlanId,
    });
  }
}
