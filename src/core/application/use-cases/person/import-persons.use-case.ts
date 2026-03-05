import { CreatePersonData, IPersonRepository } from '@/core/domain/contracts';
import type { PersonEntity } from '@/core/domain/entities';

export class ImportPersonsUseCase {
  constructor(private readonly personRepository: IPersonRepository) {}

  async execute(
    organizationId: string,
    persons: Omit<CreatePersonData, 'organizationId'>[],
  ): Promise<{ created: PersonEntity[]; skipped: string[] }> {
    const created: PersonEntity[] = [];
    const skipped: string[] = [];

    for (const personData of persons) {
      const existing = await this.personRepository.findByEmailAndOrganization(personData.email, organizationId);

      if (existing) {
        skipped.push(personData.email);
        continue;
      }

      const person = await this.personRepository.create({
        ...personData,
        organizationId,
      });

      created.push(person);
    }

    return { created, skipped };
  }
}
