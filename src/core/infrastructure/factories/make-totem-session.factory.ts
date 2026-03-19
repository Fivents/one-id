import { containerService } from '@/core/application/services';
import { HeartbeatTotemUseCase } from '@/core/application/use-cases/totem-session/heartbeat-totem.use-case';
import { RenewTotemSessionUseCase } from '@/core/application/use-cases/totem-session/renew-totem-session.use-case';
import { RevokeTotemSessionUseCase } from '@/core/application/use-cases/totem-session/revoke-totem-session.use-case';
import { ValidateTotemSessionUseCase } from '@/core/application/use-cases/totem-session/validate-totem-session.use-case';

export function makeValidateTotemSessionUseCase(): ValidateTotemSessionUseCase {
  return new ValidateTotemSessionUseCase(containerService.getSessionRepository(), containerService.getTokenProvider());
}

export function makeRevokeTotemSessionUseCase(): RevokeTotemSessionUseCase {
  return new RevokeTotemSessionUseCase(containerService.getSessionRepository());
}

export function makeRenewTotemSessionUseCase(): RenewTotemSessionUseCase {
  return new RenewTotemSessionUseCase(
    containerService.getTotemRepository(),
    containerService.getTokenProvider(),
    containerService.getSessionRepository(),
    containerService.getPasswordHasher(),
  );
}

export function makeHeartbeatTotemUseCase(): HeartbeatTotemUseCase {
  return new HeartbeatTotemUseCase(containerService.getTotemRepository());
}
