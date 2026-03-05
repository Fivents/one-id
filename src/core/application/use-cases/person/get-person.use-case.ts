import { IPersonRepository } from '@/core/domain/contracts';
import type { PersonEntity } from '@/core/domain/entities';
import { PersonNotFoundError } from '@/core/errors';

export class GetPersonUseCase {
  constructor(private readonly personRepository: IPersonRepository) {}

  async execute(id: string): Promise<PersonEntity> {
    const person = await this.personRepository.findById(id);

    if (!person) {
      throw new PersonNotFoundError(id);
    }

    return person;
  }
}
