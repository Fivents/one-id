import type { ITotemRepository } from '@/core/domain/contracts';
import type { TotemEntity } from '@/core/domain/entities';
import { TotemNotFoundError } from '@/core/errors';

interface UpdateAdminTotemData {
  name?: string;
  price?: number;
  discount?: number;
}

export class UpdateAdminTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string, data: UpdateAdminTotemData): Promise<TotemEntity> {
    const totem = await this.totemRepository.findById(id);
    if (!totem) {
      throw new TotemNotFoundError(id);
    }

    return this.totemRepository.update(id, data);
  }
}
