import { IPersonRepository } from '@/core/domain/contracts';

export class ExportPersonsUseCase {
  constructor(private readonly personRepository: IPersonRepository) {}

  async execute(organizationId: string): Promise<Record<string, unknown>[]> {
    const persons = await this.personRepository.findByOrganization(organizationId);
    return persons.map((p) => p.toJSON());
  }
}
