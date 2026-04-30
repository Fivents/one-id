import { CreatePrintConfigData, IPrintConfigRepository } from '@/core/domain/contracts';
import type { PrintConfigEntity } from '@/core/domain/entities';

export class CreatePrintConfigUseCase {
  constructor(private readonly printConfigRepository: IPrintConfigRepository) {}

  async execute(data: CreatePrintConfigData): Promise<PrintConfigEntity> {
    return this.printConfigRepository.create(data);
  }
}
