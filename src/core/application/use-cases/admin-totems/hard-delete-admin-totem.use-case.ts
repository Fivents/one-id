import type { ITotemRepository } from '@/core/domain/contracts';
import { TotemNotFoundError } from '@/core/errors';

export class HardDeleteAdminTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string): Promise<void> {
    const totem = await this.totemRepository.findByIdIncludeDeleted(id);
    if (!totem) {
      throw new TotemNotFoundError(id);
    }

    await this.totemRepository.hardDelete(id);
  }
}
