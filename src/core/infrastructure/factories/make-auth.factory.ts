import { containerService } from '@/core/application/services';
import { ListUserSessionsUseCase } from '@/core/application/use-cases/auth/list-user-sessions.use-case';
import { LoginWithTokenUseCase } from '@/core/application/use-cases/auth/login-with-token.use-case';
import { LogoutUseCase } from '@/core/application/use-cases/auth/logout.use-case';
import { RefreshSessionUseCase } from '@/core/application/use-cases/auth/refresh-session.use-case';
import { RevokeSessionUseCase } from '@/core/application/use-cases/auth/revoke-session.use-case';
import { ValidateSessionUseCase } from '@/core/application/use-cases/auth/validate-session.use-case';

export function makeLoginWithTokenUseCase(): LoginWithTokenUseCase {
  return new LoginWithTokenUseCase(
    containerService.getTokenProvider(),
    containerService.getUserRepository(),
    containerService.getSessionRepository(),
  );
}

export function makeLogoutUseCase(): LogoutUseCase {
  return new LogoutUseCase(containerService.getSessionRepository());
}

export function makeValidateSessionUseCase(): ValidateSessionUseCase {
  return new ValidateSessionUseCase(containerService.getTokenProvider());
}

export function makeRefreshSessionUseCase(): RefreshSessionUseCase {
  return new RefreshSessionUseCase(
    containerService.getTokenProvider(),
    containerService.getUserRepository(),
    containerService.getPasswordHasher(),
    containerService.getSessionRepository(),
  );
}

export function makeListUserSessionsUseCase(): ListUserSessionsUseCase {
  return new ListUserSessionsUseCase(containerService.getSessionRepository());
}

export function makeRevokeSessionUseCase(): RevokeSessionUseCase {
  return new RevokeSessionUseCase(containerService.getSessionRepository());
}
