import { IPrintConfigRepository } from '@/core/domain/contracts';
import type { PrintConfigEntity } from '@/core/domain/entities';

export class GetPrintConfigUseCase {
  constructor(private readonly printConfigRepository: IPrintConfigRepository) {}

  async execute(id: string): Promise<PrintConfigEntity> {
    const config = await this.printConfigRepository.findById(id);

    if (!config) {
      throw new GetPrintConfigError('Print config not found.');
    }

    return config;
  }
}

export class GetPrintConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetPrintConfigError';
  }
}
