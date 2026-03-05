import { IPersonRepository } from '@/core/domain/contracts';
import type { PersonEntity } from '@/core/domain/entities';

export class ListPersonsUseCase {
  constructor(private readonly personRepository: IPersonRepository) {}

  async execute(organizationId: string): Promise<PersonEntity[]> {
    return this.personRepository.findByOrganization(organizationId);
  }
}
