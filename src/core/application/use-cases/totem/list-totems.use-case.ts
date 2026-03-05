import { ITotemRepository } from '@/core/domain/contracts';
import type { TotemEntity } from '@/core/domain/entities/totem.entity';

export class ListTotemsUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(): Promise<TotemEntity[]> {
    return this.totemRepository.findAll();
  }
}
