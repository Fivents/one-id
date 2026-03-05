import { CreateOrganizationData, IOrganizationRepository } from '@/core/domain/contracts';
import type { OrganizationEntity } from '@/core/domain/entities';

export class CreateOrganizationUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(data: CreateOrganizationData): Promise<OrganizationEntity> {
    const existing = await this.organizationRepository.findBySlug(data.slug);

    if (existing) {
      throw new CreateOrganizationError('An organization with this slug already exists.');
    }

    return this.organizationRepository.create(data);
  }
}

export class CreateOrganizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreateOrganizationError';
  }
}
