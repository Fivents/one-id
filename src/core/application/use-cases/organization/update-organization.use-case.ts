import { IOrganizationRepository, UpdateOrganizationData } from '@/core/domain/contracts';
import type { OrganizationEntity } from '@/core/domain/entities';
import { OrganizationNotFoundError } from '@/core/errors';

export class UpdateOrganizationUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(id: string, data: UpdateOrganizationData): Promise<OrganizationEntity> {
    const org = await this.organizationRepository.findById(id);

    if (!org) {
      throw new OrganizationNotFoundError(id);
    }

    return this.organizationRepository.update(id, data);
  }
}
