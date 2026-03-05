import { ITotemRepository } from '@/core/domain/contracts';
import { TotemNotFoundError } from '@/core/errors';

export class HeartbeatTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(totemId: string): Promise<void> {
    const totem = await this.totemRepository.findById(totemId);

    if (!totem) {
      throw new TotemNotFoundError(totemId);
    }

    await this.totemRepository.update(totemId, { lastHeartbeat: new Date() });
  }
}
