import { ITotemRepository } from '@/core/domain/contracts';

export class DeactivateTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string): Promise<void> {
    const totem = await this.totemRepository.findById(id);

    if (!totem) {
      throw new DeactivateTotemError('Totem not found.');
    }

    if (totem.isInactive()) {
      throw new DeactivateTotemError('Totem is already inactive.');
    }

    await this.totemRepository.update(id, { status: 'INACTIVE' });
  }
}

export class DeactivateTotemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeactivateTotemError';
  }
}
