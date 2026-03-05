import { IPlanChangeRequestRepository, IPlanRepository, ISubscriptionRepository } from '@/core/domain/contracts';
import type { PlanChangeRequestEntity } from '@/core/domain/entities/plan-change-request.entity';

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
      throw new RequestPlanChangeError('Organization does not have an active subscription.');
    }

    const requestedPlan = await this.planRepository.findById(input.requestedPlanId);
    if (!requestedPlan) {
      throw new RequestPlanChangeError('Requested plan not found.');
    }

    if (subscription.planId === input.requestedPlanId) {
      throw new RequestPlanChangeError('Cannot request change to the same plan.');
    }

    const pendingRequests = await this.planChangeRequestRepository.findPendingByOrganization(input.organizationId);
    if (pendingRequests.length > 0) {
      throw new RequestPlanChangeError('Organization already has a pending plan change request.');
    }

    return this.planChangeRequestRepository.create({
      message: input.message,
      organizationId: input.organizationId,
      currentPlanId: subscription.planId,
      requestedPlanId: input.requestedPlanId,
    });
  }
}

export class RequestPlanChangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestPlanChangeError';
  }
}
