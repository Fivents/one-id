import {
  makeGetOrganizationPeopleSettingsUseCase,
  makeUpdateOrganizationPeopleSettingsUseCase,
} from '@/core/infrastructure/factories';

import {
  GetOrganizationPeopleSettingsController,
  UpdateOrganizationPeopleSettingsController,
} from '../controllers/organization-people-settings';

export function makeGetOrganizationPeopleSettingsController(): GetOrganizationPeopleSettingsController {
  return new GetOrganizationPeopleSettingsController(makeGetOrganizationPeopleSettingsUseCase());
}

export function makeUpdateOrganizationPeopleSettingsController(): UpdateOrganizationPeopleSettingsController {
  return new UpdateOrganizationPeopleSettingsController(makeUpdateOrganizationPeopleSettingsUseCase());
}
