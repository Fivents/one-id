import { CreateTotemData, ITotemRepository } from '@/core/domain/contracts';
import type { TotemEntity } from '@/core/domain/entities';
import { TotemAlreadyExistsError } from '@/core/errors';

export class CreateTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(data: CreateTotemData): Promise<TotemEntity> {
    if (data.accessCode) {
      const existing = await this.totemRepository.findByAccessCode(data.accessCode);

      if (existing) {
        throw new TotemAlreadyExistsError(data.accessCode);
      }
    }

    return this.totemRepository.create(data);
  }
}
