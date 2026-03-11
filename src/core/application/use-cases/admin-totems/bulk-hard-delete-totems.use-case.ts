import type { ITotemRepository } from '@/core/domain/contracts';

export class BulkHardDeleteTotemsUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(ids: string[]): Promise<void> {
    await this.totemRepository.hardDeleteMany(ids);
  }
}
