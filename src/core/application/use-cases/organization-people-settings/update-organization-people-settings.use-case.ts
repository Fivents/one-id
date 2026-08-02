import { IOrganizationPeopleSettingsRepository, UpsertOrganizationPeopleSettingsData } from '@/core/domain/contracts';
import type { OrganizationPeopleSettingsEntity } from '@/core/domain/entities';

export class UpdateOrganizationPeopleSettingsUseCase {
  constructor(private readonly organizationPeopleSettingsRepository: IOrganizationPeopleSettingsRepository) {}

  async execute(
    organizationId: string,
    data: UpsertOrganizationPeopleSettingsData,
  ): Promise<OrganizationPeopleSettingsEntity> {
    return this.organizationPeopleSettingsRepository.upsertByOrganizationId(organizationId, data);
  }
}
