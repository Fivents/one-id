import { LoginWithGoogleAdminUseCase } from '@/core/application/use-cases/auth/login-with-google-admin.use-case';

import { serviceContainer } from '../database/service-container';

/**
 * Factory for LoginWithGoogleAdminUseCase
 *
 * Creates a configured instance with injected dependencies:
 * - googleOAuthProvider (singleton)
 * - userRepository (singleton)
 * - authIdentityRepository (singleton)
 * - tokenProvider (singleton)
 * - sessionRepository (singleton)
 */
export function makeLoginWithGoogleAdminUseCase(): LoginWithGoogleAdminUseCase {
  return new LoginWithGoogleAdminUseCase(
    serviceContainer.getGoogleOAuthProvider(),
    serviceContainer.getUserRepository(),
    serviceContainer.getAuthIdentityRepository(),
    serviceContainer.getTokenProvider(),
    serviceContainer.getSessionRepository(),
  );
}
