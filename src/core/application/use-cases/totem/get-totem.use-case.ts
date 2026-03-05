import { ITotemRepository } from '@/core/domain/contracts';
import type { TotemEntity } from '@/core/domain/entities/totem.entity';

export class GetTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string): Promise<TotemEntity> {
    const totem = await this.totemRepository.findById(id);

    if (!totem) {
      throw new GetTotemError('Totem not found.');
    }

    return totem;
  }
}

export class GetTotemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetTotemError';
  }
}
