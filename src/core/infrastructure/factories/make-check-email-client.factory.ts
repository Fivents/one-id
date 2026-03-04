import { CheckEmailClientUseCase } from '@/core/application/use-cases/auth/check-email-client.use-case';

import { serviceContainer } from '../database/service-container';

/**
 * Factory for CheckEmailClientUseCase
 *
 * Creates a configured instance with injected dependencies:
 * - userRepository (singleton)
 * - authIdentityRepository (singleton)
 * - tokenProvider (singleton)
 */
export function makeCheckEmailClientUseCase(): CheckEmailClientUseCase {
  return new CheckEmailClientUseCase(
    serviceContainer.getUserRepository(),
    serviceContainer.getAuthIdentityRepository(),
    serviceContainer.getTokenProvider(),
  );
}
