import {
  makeCheckEmailClientUseCase,
  makeListUserSessionsUseCase,
  makeLoginWithAccessCodeTotemUseCase,
  makeLoginWithEmailClientUseCase,
  makeLoginWithGoogleAdminUseCase,
  makeLoginWithTokenUseCase,
  makeLogoutUseCase,
  makeRefreshSessionUseCase,
  makeRevokeSessionUseCase,
  makeSetupClientPasswordUseCase,
  makeValidateSessionUseCase,
} from '@/core/infrastructure/factories';

import {
  CheckEmailController,
  GoogleLoginController,
  ListSessionsController,
  LoginController,
  LogoutController,
  RefreshSessionController,
  RevokeSessionController,
  SetupPasswordController,
  TokenLoginController,
  TotemLoginController,
  ValidateSessionController,
} from '../controllers/auth';

export function makeLoginController(): LoginController {
  return new LoginController(makeLoginWithEmailClientUseCase());
}

export function makeCheckEmailController(): CheckEmailController {
  return new CheckEmailController(makeCheckEmailClientUseCase());
}

export function makeSetupPasswordController(): SetupPasswordController {
  return new SetupPasswordController(makeSetupClientPasswordUseCase());
}

export function makeGoogleLoginController(): GoogleLoginController {
  return new GoogleLoginController(makeLoginWithGoogleAdminUseCase());
}

export function makeTokenLoginController(): TokenLoginController {
  return new TokenLoginController(makeLoginWithTokenUseCase());
}

export function makeTotemLoginController(): TotemLoginController {
  return new TotemLoginController(makeLoginWithAccessCodeTotemUseCase());
}

export function makeLogoutController(): LogoutController {
  return new LogoutController(makeLogoutUseCase());
}

export function makeValidateSessionController(): ValidateSessionController {
  return new ValidateSessionController(makeValidateSessionUseCase());
}

export function makeRefreshSessionController(): RefreshSessionController {
  return new RefreshSessionController(makeRefreshSessionUseCase());
}

export function makeRevokeSessionController(): RevokeSessionController {
  return new RevokeSessionController(makeRevokeSessionUseCase());
}

export function makeListSessionsController(): ListSessionsController {
  return new ListSessionsController(makeListUserSessionsUseCase());
}
