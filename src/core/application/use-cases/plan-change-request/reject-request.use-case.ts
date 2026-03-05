import { IPlanChangeRequestRepository } from '@/core/domain/contracts';
import type { PlanChangeRequestEntity } from '@/core/domain/entities/plan-change-request.entity';
import { PlanChangeRequestAlreadyResolvedError, PlanChangeRequestNotFoundError } from '@/core/errors';

interface RejectRequestInput {
  requestId: string;
  resolvedById: string;
  resolvedNote?: string;
}

export class RejectRequestUseCase {
  constructor(private readonly planChangeRequestRepository: IPlanChangeRequestRepository) {}

  async execute(input: RejectRequestInput): Promise<PlanChangeRequestEntity> {
    const request = await this.planChangeRequestRepository.findById(input.requestId);

    if (!request) {
      throw new PlanChangeRequestNotFoundError(input.requestId);
    }

    if (!request.canResolve()) {
      throw new PlanChangeRequestAlreadyResolvedError(input.requestId);
    }

    return this.planChangeRequestRepository.resolve(input.requestId, {
      status: 'REJECTED',
      resolvedById: input.resolvedById,
      resolvedNote: input.resolvedNote ?? null,
    });
  }
}
