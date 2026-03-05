import { IPersonRepository } from '@/core/domain/contracts';

export class DeletePersonUseCase {
  constructor(private readonly personRepository: IPersonRepository) {}

  async execute(id: string): Promise<void> {
    const person = await this.personRepository.findById(id);

    if (!person) {
      throw new DeletePersonError('Person not found.');
    }

    await this.personRepository.softDelete(id);
  }
}

export class DeletePersonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeletePersonError';
  }
}
