import { ITotemRepository, UpdateTotemData } from '@/core/domain/contracts';
import type { TotemEntity } from '@/core/domain/entities';
import { TotemNotFoundError } from '@/core/errors';

export class UpdateTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string, data: UpdateTotemData): Promise<TotemEntity> {
    const totem = await this.totemRepository.findById(id);

    if (!totem) {
      throw new TotemNotFoundError(id);
    }

    return this.totemRepository.update(id, data);
  }
}
