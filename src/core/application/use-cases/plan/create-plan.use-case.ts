import { CreatePlanData, IPlanRepository } from '@/core/domain/contracts';
import type { PlanEntity } from '@/core/domain/entities/plan.entity';

export class CreatePlanUseCase {
  constructor(private readonly planRepository: IPlanRepository) {}

  async execute(data: CreatePlanData): Promise<PlanEntity> {
    return this.planRepository.create(data);
  }
}
