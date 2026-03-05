import { ITotemRepository } from '@/core/domain/contracts';

export class ActivateTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string): Promise<void> {
    const totem = await this.totemRepository.findById(id);

    if (!totem) {
      throw new ActivateTotemError('Totem not found.');
    }

    if (totem.isActive()) {
      throw new ActivateTotemError('Totem is already active.');
    }

    await this.totemRepository.update(id, { status: 'ACTIVE' });
  }
}

export class ActivateTotemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActivateTotemError';
  }
}
