import { IPrintConfigRepository } from '@/core/domain/contracts';
import type { PrintConfigEntity } from '@/core/domain/entities';
import { PrintConfigNotFoundError } from '@/core/errors';

export class GetPrintConfigUseCase {
  constructor(private readonly printConfigRepository: IPrintConfigRepository) {}

  async execute(id: string): Promise<PrintConfigEntity> {
    const config = await this.printConfigRepository.findById(id);

    if (!config) {
      throw new PrintConfigNotFoundError(id);
    }

    return config;
  }
}
