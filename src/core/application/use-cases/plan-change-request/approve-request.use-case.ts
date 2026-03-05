import { IPlanChangeRequestRepository, ISubscriptionRepository } from '@/core/domain/contracts';
import type { PlanChangeRequestEntity } from '@/core/domain/entities/plan-change-request.entity';
import { PlanChangeRequestAlreadyResolvedError, PlanChangeRequestNotFoundError } from '@/core/errors';

interface ApproveRequestInput {
  requestId: string;
  resolvedById: string;
  resolvedNote?: string;
}

export class ApproveRequestUseCase {
  constructor(
    private readonly planChangeRequestRepository: IPlanChangeRequestRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(input: ApproveRequestInput): Promise<PlanChangeRequestEntity> {
    const request = await this.planChangeRequestRepository.findById(input.requestId);

    if (!request) {
      throw new PlanChangeRequestNotFoundError(input.requestId);
    }

    if (!request.canResolve()) {
      throw new PlanChangeRequestAlreadyResolvedError(input.requestId);
    }

    const subscription = await this.subscriptionRepository.findByOrganization(request.organizationId);
    if (subscription) {
      await this.subscriptionRepository.update(subscription.id, {
        planId: request.requestedPlanId,
      });
    }

    return this.planChangeRequestRepository.resolve(input.requestId, {
      status: 'APPROVED',
      resolvedById: input.resolvedById,
      resolvedNote: input.resolvedNote ?? null,
    });
  }
}
