import {
  makeLinkTotemToEventUseCase,
  makeListEventTotemsUseCase,
  makeSetTotemLocationUseCase,
  makeUnlinkTotemFromEventUseCase,
} from '@/core/infrastructure/factories';

import {
  LinkTotemToEventController,
  ListEventTotemsController,
  SetTotemLocationController,
  UnlinkTotemFromEventController,
} from '../controllers/totem-event-subscription';

export function makeLinkTotemToEventController(): LinkTotemToEventController {
  return new LinkTotemToEventController(makeLinkTotemToEventUseCase());
}

export function makeUnlinkTotemFromEventController(): UnlinkTotemFromEventController {
  return new UnlinkTotemFromEventController(makeUnlinkTotemFromEventUseCase());
}

export function makeSetTotemLocationController(): SetTotemLocationController {
  return new SetTotemLocationController(makeSetTotemLocationUseCase());
}

export function makeListEventTotemsController(): ListEventTotemsController {
  return new ListEventTotemsController(makeListEventTotemsUseCase());
}
