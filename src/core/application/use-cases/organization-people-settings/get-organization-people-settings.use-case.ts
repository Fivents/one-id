import { IOrganizationPeopleSettingsRepository } from '@/core/domain/contracts';
import { OrganizationPeopleSettingsEntity } from '@/core/domain/entities';

export class GetOrganizationPeopleSettingsUseCase {
  constructor(private readonly organizationPeopleSettingsRepository: IOrganizationPeopleSettingsRepository) {}

  async execute(organizationId: string): Promise<OrganizationPeopleSettingsEntity> {
    const settings = await this.organizationPeopleSettingsRepository.findByOrganizationId(organizationId);

    return settings ?? OrganizationPeopleSettingsEntity.default(organizationId);
  }
}
