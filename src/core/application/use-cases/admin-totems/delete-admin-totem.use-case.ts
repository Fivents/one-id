import type { ITotemRepository } from '@/core/domain/contracts';
import { TotemNotFoundError } from '@/core/errors';

export class DeleteAdminTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string): Promise<void> {
    const totem = await this.totemRepository.findById(id);
    if (!totem) {
      throw new TotemNotFoundError(id);
    }

    await this.totemRepository.softDelete(id);
  }
}
