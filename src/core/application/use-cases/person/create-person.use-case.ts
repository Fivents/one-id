import { CreatePersonData, IPersonRepository } from '@/core/domain/contracts';
import type { PersonEntity } from '@/core/domain/entities';

export class CreatePersonUseCase {
  constructor(private readonly personRepository: IPersonRepository) {}

  async execute(data: CreatePersonData): Promise<PersonEntity> {
    const existing = await this.personRepository.findByEmailAndOrganization(data.email, data.organizationId);

    if (existing) {
      throw new CreatePersonError('A person with this email already exists in this organization.');
    }

    return this.personRepository.create(data);
  }
}

export class CreatePersonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreatePersonError';
  }
}
