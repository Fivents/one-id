import { IPlanChangeRequestRepository } from '@/core/domain/contracts';
import type { PlanChangeRequestEntity } from '@/core/domain/entities/plan-change-request.entity';

export class GetRequestUseCase {
  constructor(private readonly planChangeRequestRepository: IPlanChangeRequestRepository) {}

  async execute(id: string): Promise<PlanChangeRequestEntity> {
    const request = await this.planChangeRequestRepository.findById(id);

    if (!request) {
      throw new GetRequestError('Plan change request not found.');
    }

    return request;
  }
}

export class GetRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetRequestError';
  }
}
