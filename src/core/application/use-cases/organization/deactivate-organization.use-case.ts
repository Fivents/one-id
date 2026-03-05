import { IOrganizationRepository } from '@/core/domain/contracts';
import type { OrganizationEntity } from '@/core/domain/entities';

export class DeactivateOrganizationUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(id: string): Promise<OrganizationEntity> {
    const org = await this.organizationRepository.findById(id);

    if (!org) {
      throw new DeactivateOrganizationError('Organization not found.');
    }

    if (!org.isActive) {
      throw new DeactivateOrganizationError('Organization is already inactive.');
    }

    return this.organizationRepository.update(id, { isActive: false });
  }
}

export class DeactivateOrganizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeactivateOrganizationError';
  }
}
