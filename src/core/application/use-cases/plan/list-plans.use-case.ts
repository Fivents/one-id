import { IPlanRepository } from '@/core/domain/contracts';
import type { PlanEntity } from '@/core/domain/entities/plan.entity';

export class ListPlansUseCase {
  constructor(private readonly planRepository: IPlanRepository) {}

  async execute(activeOnly: boolean = false): Promise<PlanEntity[]> {
    if (activeOnly) {
      return this.planRepository.findAllActive();
    }

    return this.planRepository.findAll();
  }
}
