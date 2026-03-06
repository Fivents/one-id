import type { ITotemRepository } from '@/core/domain/contracts';
import type { TotemEntity } from '@/core/domain/entities';
import { TotemNotFoundError } from '@/core/errors';

export class RestoreAdminTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string): Promise<TotemEntity> {
    const totem = await this.totemRepository.findByIdIncludeDeleted(id);
    if (!totem || !totem.deletedAt) {
      throw new TotemNotFoundError(id);
    }

    return this.totemRepository.restore(id);
  }
}
