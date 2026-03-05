import { IPlanRepository } from '@/core/domain/contracts';
import type { PlanEntity } from '@/core/domain/entities/plan.entity';

export class GetPlanUseCase {
  constructor(private readonly planRepository: IPlanRepository) {}

  async execute(id: string): Promise<PlanEntity> {
    const plan = await this.planRepository.findById(id);

    if (!plan) {
      throw new GetPlanError('Plan not found.');
    }

    return plan;
  }
}

export class GetPlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetPlanError';
  }
}
