import { ITotemRepository } from '@/core/domain/contracts';
import { TotemAlreadyInMaintenanceError, TotemNotFoundError } from '@/core/errors';

export class SetMaintenanceTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string): Promise<void> {
    const totem = await this.totemRepository.findById(id);

    if (!totem) {
      throw new TotemNotFoundError(id);
    }

    if (totem.isInMaintenance()) {
      throw new TotemAlreadyInMaintenanceError(id);
    }

    await this.totemRepository.update(id, { status: 'MAINTENANCE' });
  }
}
