import { LoginWithAccessCodeTotemUseCase } from '@/core/application/use-cases/auth/login-with-access-code-totem.use-case';

import { serviceContainer } from '../database/service-container';

/**
 * Factory for LoginWithAccessCodeTotemUseCase
 *
 * Creates a configured instance with injected dependencies:
 * - totemRepository (singleton)
 * - tokenProvider (singleton)
 * - sessionRepository (singleton)
 */
export function makeLoginWithAccessCodeTotemUseCase(): LoginWithAccessCodeTotemUseCase {
  return new LoginWithAccessCodeTotemUseCase(
    serviceContainer.getTotemRepository(),
    serviceContainer.getTokenProvider(),
    serviceContainer.getSessionRepository(),
  );
}
