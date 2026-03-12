import type { ITotemRepository } from '@/core/domain/contracts';
import type { TotemEntity, TotemStatus } from '@/core/domain/entities';
import {
  TotemAlreadyActiveError,
  TotemAlreadyInactiveError,
  TotemAlreadyInMaintenanceError,
  TotemNotFoundError,
} from '@/core/errors';

export class ChangeTotemStatusUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string, status: TotemStatus): Promise<TotemEntity> {
    const totem = await this.totemRepository.findById(id);
    if (!totem) {
      throw new TotemNotFoundError(id);
    }

    if (totem.status === status) {
      if (status === 'ACTIVE') throw new TotemAlreadyActiveError(id);
      if (status === 'INACTIVE') throw new TotemAlreadyInactiveError(id);
      if (status === 'MAINTENANCE') throw new TotemAlreadyInMaintenanceError(id);
    }

    return this.totemRepository.update(id, { status });
  }
}
