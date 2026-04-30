import {
  makeHeartbeatTotemUseCase,
  makeRenewTotemSessionUseCase,
  makeRevokeTotemSessionUseCase,
  makeValidateTotemSessionUseCase,
} from '@/core/infrastructure/factories';

import {
  HeartbeatTotemController,
  RenewTotemSessionController,
  RevokeTotemSessionController,
  ValidateTotemSessionController,
} from '../controllers/totem-session';

export function makeValidateTotemSessionController(): ValidateTotemSessionController {
  return new ValidateTotemSessionController(makeValidateTotemSessionUseCase());
}

export function makeRenewTotemSessionController(): RenewTotemSessionController {
  return new RenewTotemSessionController(makeRenewTotemSessionUseCase());
}

export function makeRevokeTotemSessionController(): RevokeTotemSessionController {
  return new RevokeTotemSessionController(makeRevokeTotemSessionUseCase());
}

export function makeHeartbeatTotemController(): HeartbeatTotemController {
  return new HeartbeatTotemController(makeHeartbeatTotemUseCase());
}
