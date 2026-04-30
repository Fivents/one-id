import { IPlanRepository, UpdatePlanData } from '@/core/domain/contracts';
import type { PlanEntity } from '@/core/domain/entities/plan.entity';
import { PlanNotFoundError } from '@/core/errors';

export class UpdatePlanUseCase {
  constructor(private readonly planRepository: IPlanRepository) {}

  async execute(id: string, data: UpdatePlanData): Promise<PlanEntity> {
    const plan = await this.planRepository.findById(id);

    if (!plan) {
      throw new PlanNotFoundError(id);
    }

    return this.planRepository.update(id, data);
  }
}
