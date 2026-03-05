import { ITotemRepository } from '@/core/domain/contracts';

export class DeleteTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(id: string): Promise<void> {
    const totem = await this.totemRepository.findById(id);

    if (!totem) {
      throw new DeleteTotemError('Totem not found.');
    }

    await this.totemRepository.softDelete(id);
  }
}

export class DeleteTotemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeleteTotemError';
  }
}
