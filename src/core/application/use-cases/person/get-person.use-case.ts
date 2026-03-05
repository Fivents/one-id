import { IPersonRepository } from '@/core/domain/contracts';
import type { PersonEntity } from '@/core/domain/entities';

export class GetPersonUseCase {
  constructor(private readonly personRepository: IPersonRepository) {}

  async execute(id: string): Promise<PersonEntity> {
    const person = await this.personRepository.findById(id);

    if (!person) {
      throw new GetPersonError('Person not found.');
    }

    return person;
  }
}

export class GetPersonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetPersonError';
  }
}
