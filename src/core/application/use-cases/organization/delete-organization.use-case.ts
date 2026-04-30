import { IOrganizationRepository } from '@/core/domain/contracts';
import { OrganizationNotFoundError } from '@/core/errors';

export class DeleteOrganizationUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(id: string): Promise<void> {
    const org = await this.organizationRepository.findById(id);

    if (!org) {
      throw new OrganizationNotFoundError(id);
    }

    await this.organizationRepository.softDelete(id);
  }
}
