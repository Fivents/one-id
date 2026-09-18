import {
  makeConnectSymplaUseCase,
  makeDisconnectSymplaUseCase,
  makeGetSymplaConnectionStatusUseCase,
} from '@/core/infrastructure/factories';

import {
  ConnectSymplaController,
  DisconnectSymplaController,
  GetSymplaConnectionStatusController,
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
