import { ITotemRepository } from '@/core/domain/contracts';
import type { TotemEntity } from '@/core/domain/entities/totem.entity';
import { TotemNotFoundError } from '@/core/errors';

export class GetTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string): Promise<TotemEntity> {
    const totem = await this.totemRepository.findById(id);

    if (!totem) {
      throw new TotemNotFoundError(id);
    }

    return totem;
  }
}
