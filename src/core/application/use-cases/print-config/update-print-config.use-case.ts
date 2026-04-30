import { IPrintConfigRepository, UpdatePrintConfigData } from '@/core/domain/contracts';
import type { PrintConfigEntity } from '@/core/domain/entities';
import { PrintConfigNotFoundError } from '@/core/errors';

export class UpdatePrintConfigUseCase {
  constructor(private readonly printConfigRepository: IPrintConfigRepository) {}

  async execute(id: string, data: UpdatePrintConfigData): Promise<PrintConfigEntity> {
    const config = await this.printConfigRepository.findById(id);

    if (!config) {
      throw new PrintConfigNotFoundError(id);
    }

    return this.printConfigRepository.update(id, data);
  }
}
