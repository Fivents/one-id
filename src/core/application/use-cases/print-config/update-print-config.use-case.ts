import { IPrintConfigRepository, UpdatePrintConfigData } from '@/core/domain/contracts';
import type { PrintConfigEntity } from '@/core/domain/entities';

export class UpdatePrintConfigUseCase {
  constructor(private readonly printConfigRepository: IPrintConfigRepository) {}

  async execute(id: string, data: UpdatePrintConfigData): Promise<PrintConfigEntity> {
    const config = await this.printConfigRepository.findById(id);

    if (!config) {
      throw new UpdatePrintConfigError('Print config not found.');
    }

    return this.printConfigRepository.update(id, data);
  }
}

export class UpdatePrintConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdatePrintConfigError';
  }
}
