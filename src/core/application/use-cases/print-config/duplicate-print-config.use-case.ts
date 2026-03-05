import { IPrintConfigRepository } from '@/core/domain/contracts';
import type { PrintConfigEntity } from '@/core/domain/entities';
import { PrintConfigNotFoundError } from '@/core/errors';

export class DuplicatePrintConfigUseCase {
  constructor(private readonly printConfigRepository: IPrintConfigRepository) {}

  async execute(id: string): Promise<PrintConfigEntity> {
    const config = await this.printConfigRepository.findById(id);

    if (!config) {
      throw new PrintConfigNotFoundError(id);
    }

    const json = config.toJSON();
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = json;

    return this.printConfigRepository.create(rest as Parameters<typeof this.printConfigRepository.create>[0]);
  }
}
