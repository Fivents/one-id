import { ITotemRepository } from '@/core/domain/contracts';
import { TotemAlreadyActiveError, TotemNotFoundError } from '@/core/errors';

export class ActivateTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string): Promise<void> {
    const totem = await this.totemRepository.findById(id);

    if (!totem) {
      throw new TotemNotFoundError(id);
    }

    if (totem.isActive()) {
      throw new TotemAlreadyActiveError(id);
    }

    await this.totemRepository.update(id, { status: 'ACTIVE' });
  }
}
