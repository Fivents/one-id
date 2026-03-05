import { IPersonRepository, UpdatePersonData } from '@/core/domain/contracts';
import type { PersonEntity } from '@/core/domain/entities';

export class UpdatePersonUseCase {
  constructor(private readonly personRepository: IPersonRepository) {}

  async execute(id: string, data: UpdatePersonData): Promise<PersonEntity> {
    const person = await this.personRepository.findById(id);

    if (!person) {
      throw new UpdatePersonError('Person not found.');
    }

    return this.personRepository.update(id, data);
  }
}

export class UpdatePersonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdatePersonError';
  }
}
