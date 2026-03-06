import { randomBytes } from 'crypto';

import type { ITotemRepository } from '@/core/domain/contracts';
import type { TotemEntity } from '@/core/domain/entities';
import { TotemNotFoundError } from '@/core/errors';

export class GenerateTotemAccessTokenUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string): Promise<TotemEntity> {
    const totem = await this.totemRepository.findById(id);
    if (!totem) {
      throw new TotemNotFoundError(id);
    }

    const accessToken = randomBytes(32).toString('hex');

    return this.totemRepository.updateAccessToken(id, accessToken);
  }
}
