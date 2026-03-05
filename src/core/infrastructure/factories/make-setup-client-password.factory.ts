import { containerService } from '@/core/application/services';
import { SetupClientPasswordUseCase } from '@/core/application/use-cases/auth/setup-client-password.use-case';

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
    containerService.getTokenProvider(),
    containerService.getAuthIdentityRepository(),
    containerService.getPasswordHasher(),
  );
}
