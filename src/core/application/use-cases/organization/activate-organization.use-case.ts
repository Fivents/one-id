import { IOrganizationRepository } from '@/core/domain/contracts';
import type { OrganizationEntity } from '@/core/domain/entities';
import { OrganizationAlreadyActiveError, OrganizationNotFoundError } from '@/core/errors';

export class ActivateOrganizationUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(id: string): Promise<OrganizationEntity> {
    const org = await this.organizationRepository.findById(id);

    if (!org) {
      throw new OrganizationNotFoundError(id);
    }

    if (org.isActive) {
      throw new OrganizationAlreadyActiveError(id);
    }

    return this.organizationRepository.update(id, { isActive: true });
  }
}
