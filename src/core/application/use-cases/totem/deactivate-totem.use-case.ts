import { ITotemRepository } from '@/core/domain/contracts';
import { TotemAlreadyInactiveError, TotemNotFoundError } from '@/core/errors';

export class DeactivateTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string): Promise<void> {
    const totem = await this.totemRepository.findById(id);

    if (!totem) {
      throw new TotemNotFoundError(id);
    }

    if (totem.isInactive()) {
      throw new TotemAlreadyInactiveError(id);
    }

    await this.totemRepository.update(id, { status: 'INACTIVE' });
  }
}
