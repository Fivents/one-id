import { containerService } from '@/core/application/services';
import { GetOrganizationPeopleSettingsUseCase } from '@/core/application/use-cases/organization-people-settings/get-organization-people-settings.use-case';
import { UpdateOrganizationPeopleSettingsUseCase } from '@/core/application/use-cases/organization-people-settings/update-organization-people-settings.use-case';

export function makeGetOrganizationPeopleSettingsUseCase(): GetOrganizationPeopleSettingsUseCase {
  return new GetOrganizationPeopleSettingsUseCase(containerService.getOrganizationPeopleSettingsRepository());
}

export function makeUpdateOrganizationPeopleSettingsUseCase(): UpdateOrganizationPeopleSettingsUseCase {
  return new UpdateOrganizationPeopleSettingsUseCase(containerService.getOrganizationPeopleSettingsRepository());
}
