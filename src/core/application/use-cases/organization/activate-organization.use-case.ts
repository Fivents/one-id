import { IOrganizationRepository } from '@/core/domain/contracts';
import type { OrganizationEntity } from '@/core/domain/entities';

export class ActivateOrganizationUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(id: string): Promise<OrganizationEntity> {
    const org = await this.organizationRepository.findById(id);

    if (!org) {
      throw new ActivateOrganizationError('Organization not found.');
    }

    if (org.isActive) {
      throw new ActivateOrganizationError('Organization is already active.');
    }

    return this.organizationRepository.update(id, { isActive: true });
  }
}

export class ActivateOrganizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActivateOrganizationError';
  }
}
