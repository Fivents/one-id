import { IPlanRepository } from '@/core/domain/contracts';
import type { PlanEntity } from '@/core/domain/entities/plan.entity';
import { PlanNotFoundError } from '@/core/errors';

export class GetPlanUseCase {
  constructor(private readonly planRepository: IPlanRepository) {}

  async execute(id: string): Promise<PlanEntity> {
    const plan = await this.planRepository.findById(id);

    if (!plan) {
      throw new PlanNotFoundError(id);
    }

    return plan;
  }
}
