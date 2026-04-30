import { IOrganizationRepository } from '@/core/domain/contracts';
import type { OrganizationEntity } from '@/core/domain/entities';
import { OrganizationNotFoundError } from '@/core/errors';

export class GetOrganizationUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(id: string): Promise<OrganizationEntity> {
    const org = await this.organizationRepository.findById(id);

    if (!org) {
      throw new OrganizationNotFoundError(id);
    }

    return org;
  }
}
