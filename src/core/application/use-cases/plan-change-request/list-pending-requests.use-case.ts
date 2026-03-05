import { IPlanChangeRequestRepository } from '@/core/domain/contracts';
import type { PlanChangeRequestEntity } from '@/core/domain/entities/plan-change-request.entity';

export class ListPendingRequestsUseCase {
  constructor(private readonly planChangeRequestRepository: IPlanChangeRequestRepository) {}

  async execute(organizationId?: string): Promise<PlanChangeRequestEntity[]> {
    if (organizationId) {
      return this.planChangeRequestRepository.findPendingByOrganization(organizationId);
    }

    return this.planChangeRequestRepository.findAllPending();
  }
}
