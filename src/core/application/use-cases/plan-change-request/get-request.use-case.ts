import { IPlanChangeRequestRepository } from '@/core/domain/contracts';
import type { PlanChangeRequestEntity } from '@/core/domain/entities/plan-change-request.entity';
import { PlanChangeRequestNotFoundError } from '@/core/errors';

export class GetRequestUseCase {
  constructor(private readonly planChangeRequestRepository: IPlanChangeRequestRepository) {}

  async execute(id: string): Promise<PlanChangeRequestEntity> {
    const request = await this.planChangeRequestRepository.findById(id);

    if (!request) {
      throw new PlanChangeRequestNotFoundError(id);
    }

    return request;
  }
}
