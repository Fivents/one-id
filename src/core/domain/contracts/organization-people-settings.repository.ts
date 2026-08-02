import type {
  CodeSourceField,
  OrganizationPeopleSettingsEntity,
} from '../entities/organization-people-settings.entity';

export interface UpsertOrganizationPeopleSettingsData {
  accessCodeSource?: CodeSourceField;
  qrCodeSource?: CodeSourceField;
}

export interface IOrganizationPeopleSettingsRepository {
  findByOrganizationId(organizationId: string): Promise<OrganizationPeopleSettingsEntity | null>;
  upsertByOrganizationId(
    organizationId: string,
    data: UpsertOrganizationPeopleSettingsData,
  ): Promise<OrganizationPeopleSettingsEntity>;
}
