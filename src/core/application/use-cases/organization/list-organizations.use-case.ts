import { IOrganizationRepository } from '@/core/domain/contracts';
import type { OrganizationEntity } from '@/core/domain/entities';

export class ListOrganizationsUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(): Promise<OrganizationEntity[]> {
    return this.organizationRepository.findAll();
  }
}
