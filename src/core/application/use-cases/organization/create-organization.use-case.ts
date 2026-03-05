import { CreateOrganizationData, IOrganizationRepository } from '@/core/domain/contracts';
import type { OrganizationEntity } from '@/core/domain/entities';
import { OrganizationAlreadyExistsError } from '@/core/errors';

export class CreateOrganizationUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(data: CreateOrganizationData): Promise<OrganizationEntity> {
    const existing = await this.organizationRepository.findBySlug(data.slug);

    if (existing) {
      throw new OrganizationAlreadyExistsError(data.slug);
    }

    return this.organizationRepository.create(data);
  }
}
