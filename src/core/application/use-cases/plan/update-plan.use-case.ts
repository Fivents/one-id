import { IPlanRepository, UpdatePlanData } from '@/core/domain/contracts';
import type { PlanEntity } from '@/core/domain/entities/plan.entity';

export class UpdatePlanUseCase {
  constructor(private readonly planRepository: IPlanRepository) {}

  async execute(id: string, data: UpdatePlanData): Promise<PlanEntity> {
    const plan = await this.planRepository.findById(id);

    if (!plan) {
      throw new UpdatePlanError('Plan not found.');
    }

    return this.planRepository.update(id, data);
  }
}

export class UpdatePlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdatePlanError';
  }
}
