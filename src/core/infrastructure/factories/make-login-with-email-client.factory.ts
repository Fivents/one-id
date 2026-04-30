import { containerService } from '@/core/application/services';
import { LoginWithEmailClientUseCase } from '@/core/application/use-cases/auth/login-with-email-client.use-case';

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
    containerService.getUserRepository(),
    containerService.getAuthIdentityRepository(),
    containerService.getPasswordHasher(),
    containerService.getTokenProvider(),
    containerService.getSessionRepository(),
    containerService.getMembershipRepository(),
  );
}
