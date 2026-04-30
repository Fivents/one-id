import {
  makeCheckTotemAvailabilityUseCase,
  makeLinkTotemToOrgUseCase,
  makeListOrgTotemsUseCase,
  makeUnlinkTotemFromOrgUseCase,
} from '@/core/infrastructure/factories';

import {
  CheckTotemAvailabilityController,
  LinkTotemToOrgController,
  ListOrgTotemsController,
  UnlinkTotemFromOrgController,
} from '../controllers/totem-organization-subscription';

export function makeLinkTotemToOrgController(): LinkTotemToOrgController {
  return new LinkTotemToOrgController(makeLinkTotemToOrgUseCase());
}

export function makeUnlinkTotemFromOrgController(): UnlinkTotemFromOrgController {
  return new UnlinkTotemFromOrgController(makeUnlinkTotemFromOrgUseCase());
}

export function makeListOrgTotemsController(): ListOrgTotemsController {
  return new ListOrgTotemsController(makeListOrgTotemsUseCase());
}

export function makeCheckTotemAvailabilityController(): CheckTotemAvailabilityController {
  return new CheckTotemAvailabilityController(makeCheckTotemAvailabilityUseCase());
}
