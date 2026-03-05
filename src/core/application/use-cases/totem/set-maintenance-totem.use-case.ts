import { ITotemRepository } from '@/core/domain/contracts';

export class SetMaintenanceTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string): Promise<void> {
    const totem = await this.totemRepository.findById(id);

    if (!totem) {
      throw new SetMaintenanceTotemError('Totem not found.');
    }

    if (totem.isInMaintenance()) {
      throw new SetMaintenanceTotemError('Totem is already in maintenance.');
    }

    await this.totemRepository.update(id, { status: 'MAINTENANCE' });
  }
}

export class SetMaintenanceTotemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SetMaintenanceTotemError';
  }
}
