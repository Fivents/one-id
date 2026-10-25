import {
  makeConnectSymplaUseCase,
  makeDisconnectSymplaUseCase,
  makeGetSymplaConnectionStatusUseCase,
  makeLinkEventToSymplaUseCase,
  makeListSymplaEventsUseCase,
  makeUnlinkEventFromSymplaUseCase,
} from '@/core/infrastructure/factories';

import {
  ConnectSymplaController,
  DisconnectSymplaController,
  GetSymplaConnectionStatusController,
  LinkEventToSymplaController,
  ListSymplaEventsController,
  UnlinkEventFromSymplaController,
} from '../controllers/sympla';

export function makeConnectSymplaController(): ConnectSymplaController {
  return new ConnectSymplaController(makeConnectSymplaUseCase());
}

export function makeDisconnectSymplaController(): DisconnectSymplaController {
  return new DisconnectSymplaController(makeDisconnectSymplaUseCase());
}

export function makeGetSymplaConnectionStatusController(): GetSymplaConnectionStatusController {
  return new GetSymplaConnectionStatusController(makeGetSymplaConnectionStatusUseCase());
}

export function makeLinkEventToSymplaController(): LinkEventToSymplaController {
  return new LinkEventToSymplaController(makeLinkEventToSymplaUseCase());
}

export function makeUnlinkEventFromSymplaController(): UnlinkEventFromSymplaController {
  return new UnlinkEventFromSymplaController(makeUnlinkEventFromSymplaUseCase());
}

export function makeListSymplaEventsController(): ListSymplaEventsController {
  return new ListSymplaEventsController(makeListSymplaEventsUseCase());
}
