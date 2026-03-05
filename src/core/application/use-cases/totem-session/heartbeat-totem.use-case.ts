import { ITotemRepository } from '@/core/domain/contracts';

export class HeartbeatTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(totemId: string): Promise<void> {
    const totem = await this.totemRepository.findById(totemId);

    if (!totem) {
      throw new HeartbeatTotemError('Totem not found.');
    }

    await this.totemRepository.update(totemId, { lastHeartbeat: new Date() });
  }
}

export class HeartbeatTotemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HeartbeatTotemError';
  }
}
