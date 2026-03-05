import { IPersonRepository } from '@/core/domain/contracts';
import { PersonNotFoundError } from '@/core/errors';

export class DeletePersonUseCase {
  constructor(private readonly personRepository: IPersonRepository) {}

  async execute(id: string): Promise<void> {
    const person = await this.personRepository.findById(id);

    if (!person) {
      throw new PersonNotFoundError(id);
    }

    await this.personRepository.softDelete(id);
  }
}
