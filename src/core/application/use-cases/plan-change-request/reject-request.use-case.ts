import { IPlanChangeRequestRepository } from '@/core/domain/contracts';
import type { PlanChangeRequestEntity } from '@/core/domain/entities/plan-change-request.entity';

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
      throw new RejectRequestError('Plan change request not found.');
    }

    if (!request.canResolve()) {
      throw new RejectRequestError('Request has already been resolved.');
    }

    return this.planChangeRequestRepository.resolve(input.requestId, {
      status: 'REJECTED',
      resolvedById: input.resolvedById,
      resolvedNote: input.resolvedNote ?? null,
    });
  }
}

export class RejectRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RejectRequestError';
  }
}
