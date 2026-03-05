import { IPersonRepository, UpdatePersonData } from '@/core/domain/contracts';
import type { PersonEntity } from '@/core/domain/entities';
import { PersonNotFoundError } from '@/core/errors';

export class UpdatePersonUseCase {
  constructor(private readonly personRepository: IPersonRepository) {}

  async execute(id: string, data: UpdatePersonData): Promise<PersonEntity> {
    const person = await this.personRepository.findById(id);

    if (!person) {
      throw new PersonNotFoundError(id);
    }

    return this.personRepository.update(id, data);
  }
}
