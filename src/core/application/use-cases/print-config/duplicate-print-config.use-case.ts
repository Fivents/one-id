import { IPrintConfigRepository } from '@/core/domain/contracts';
import type { PrintConfigEntity } from '@/core/domain/entities';

export class DuplicatePrintConfigUseCase {
  constructor(private readonly printConfigRepository: IPrintConfigRepository) {}

  async execute(id: string): Promise<PrintConfigEntity> {
    const config = await this.printConfigRepository.findById(id);

    if (!config) {
      throw new DuplicatePrintConfigError('Print config not found.');
    }

    const json = config.toJSON();
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = json;

    return this.printConfigRepository.create(rest as Parameters<typeof this.printConfigRepository.create>[0]);
  }
}

export class DuplicatePrintConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicatePrintConfigError';
  }
}
