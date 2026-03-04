import { LoginWithEmailClientUseCase } from '@/core/application/use-cases/auth/login-with-email-client.use-case';

import { serviceContainer } from '../database/service-container';

/**
 * Factory for LoginWithEmailClientUseCase
 *
 * Creates a configured instance with injected dependencies:
 * - userRepository (singleton)
 * - authIdentityRepository (singleton)
 * - passwordHasher (singleton)
 * - tokenProvider (singleton)
 * - sessionRepository (singleton)
 */
export function makeLoginWithEmailClientUseCase(): LoginWithEmailClientUseCase {
  return new LoginWithEmailClientUseCase(
    serviceContainer.getUserRepository(),
    serviceContainer.getAuthIdentityRepository(),
    serviceContainer.getPasswordHasher(),
    serviceContainer.getTokenProvider(),
    serviceContainer.getSessionRepository(),
  );
}
