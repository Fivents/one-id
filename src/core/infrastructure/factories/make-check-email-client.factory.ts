import { containerService } from '@/core/application/services';
import { CheckEmailClientUseCase } from '@/core/application/use-cases/auth/check-email-client.use-case';

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
    containerService.getUserRepository(),
    containerService.getAuthIdentityRepository(),
    containerService.getTokenProvider(),
    containerService.getMembershipRepository(),
  );
}
