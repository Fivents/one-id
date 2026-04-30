import type { ITotemRepository } from '@/core/domain/contracts';
import type { TotemEntity } from '@/core/domain/entities';

export class ListDeletedTotemsUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(): Promise<TotemEntity[]> {
    return this.totemRepository.findAllDeleted();
  }
}
