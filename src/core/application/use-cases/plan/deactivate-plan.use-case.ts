import { IPlanRepository } from '@/core/domain/contracts';

export class DeactivatePlanUseCase {
  constructor(private readonly planRepository: IPlanRepository) {}

  async execute(id: string): Promise<void> {
    const plan = await this.planRepository.findById(id);

    if (!plan) {
      throw new DeactivatePlanError('Plan not found.');
    }

    if (!plan.isActive) {
      throw new DeactivatePlanError('Plan is already inactive.');
    }

    await this.planRepository.update(id, { isActive: false });
  }
}

export class DeactivatePlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeactivatePlanError';
  }
}
