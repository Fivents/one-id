import { IOrganizationRepository } from '@/core/domain/contracts';
import type { OrganizationEntity } from '@/core/domain/entities';

export class GetOrganizationUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(id: string): Promise<OrganizationEntity> {
    const org = await this.organizationRepository.findById(id);

    if (!org) {
      throw new GetOrganizationError('Organization not found.');
    }

    return org;
  }
}

export class GetOrganizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetOrganizationError';
  }
}
