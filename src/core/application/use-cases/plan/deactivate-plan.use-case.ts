import { IPlanRepository } from '@/core/domain/contracts';
import { PlanAlreadyInactiveError, PlanNotFoundError } from '@/core/errors';

export class DeactivatePlanUseCase {
  constructor(private readonly planRepository: IPlanRepository) {}

  async execute(id: string): Promise<void> {
    const plan = await this.planRepository.findById(id);

    if (!plan) {
      throw new PlanNotFoundError(id);
    }

    if (!plan.isActive) {
      throw new PlanAlreadyInactiveError(id);
    }

    await this.planRepository.update(id, { isActive: false });
  }
}
