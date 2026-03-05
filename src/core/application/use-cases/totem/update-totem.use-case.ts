import { ITotemRepository, UpdateTotemData } from '@/core/domain/contracts';
import type { TotemEntity } from '@/core/domain/entities';

export class UpdateTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string, data: UpdateTotemData): Promise<TotemEntity> {
    const totem = await this.totemRepository.findById(id);

    if (!totem) {
      throw new UpdateTotemError('Totem not found.');
    }

    return this.totemRepository.update(id, data);
  }
}

export class UpdateTotemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdateTotemError';
  }
}
