import { IOrganizationRepository, UpdateOrganizationData } from '@/core/domain/contracts';
import type { OrganizationEntity } from '@/core/domain/entities';

export class UpdateOrganizationUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(id: string, data: UpdateOrganizationData): Promise<OrganizationEntity> {
    const org = await this.organizationRepository.findById(id);

    if (!org) {
      throw new UpdateOrganizationError('Organization not found.');
    }

    return this.organizationRepository.update(id, data);
  }
}

export class UpdateOrganizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdateOrganizationError';
  }
}
