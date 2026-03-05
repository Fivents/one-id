import { CreateTotemData, ITotemRepository } from '@/core/domain/contracts';
import type { TotemEntity } from '@/core/domain/entities';

export class CreateTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(data: CreateTotemData): Promise<TotemEntity> {
    const existing = await this.totemRepository.findByAccessCode(data.accessCode);

    if (existing) {
      throw new CreateTotemError('A totem with this access code already exists.');
    }

    return this.totemRepository.create(data);
  }
}

export class CreateTotemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreateTotemError';
  }
}
