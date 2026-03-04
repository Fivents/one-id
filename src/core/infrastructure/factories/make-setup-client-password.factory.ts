import { SetupClientPasswordUseCase } from '@/core/application/use-cases/auth/setup-client-password.use-case';

import { serviceContainer } from '../database/service-container';

/**
 * Factory for SetupClientPasswordUseCase
 *
 * Creates a configured instance with injected dependencies:
 * - tokenProvider (singleton)
 * - authIdentityRepository (singleton)
 * - passwordHasher (singleton)
 */
export function makeSetupClientPasswordUseCase(): SetupClientPasswordUseCase {
  return new SetupClientPasswordUseCase(
    serviceContainer.getTokenProvider(),
    serviceContainer.getAuthIdentityRepository(),
    serviceContainer.getPasswordHasher(),
  );
}
