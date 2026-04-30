import type { ITotemRepository } from '@/core/domain/contracts';

export class BulkSoftDeleteTotemsUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(ids: string[]): Promise<void> {
    await this.totemRepository.softDeleteMany(ids);
  }
}
