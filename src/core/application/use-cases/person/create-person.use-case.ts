import { CreatePersonData, IPersonRepository } from '@/core/domain/contracts';
import type { PersonEntity } from '@/core/domain/entities';
import { PersonAlreadyExistsError } from '@/core/errors';

export class CreatePersonUseCase {
  constructor(private readonly personRepository: IPersonRepository) {}

  async execute(data: CreatePersonData): Promise<PersonEntity> {
    const existing = await this.personRepository.findByEmailAndOrganization(data.email, data.organizationId);

    if (existing) {
      throw new PersonAlreadyExistsError(data.email, data.organizationId);
    }

    return this.personRepository.create(data);
  }
}
