import { containerService } from '@/core/application/services';
import { LoginWithGoogleAdminUseCase } from '@/core/application/use-cases/auth/login-with-google-admin.use-case';

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
    containerService.getGoogleOAuthProvider(),
    containerService.getUserRepository(),
    containerService.getAuthIdentityRepository(),
    containerService.getTokenProvider(),
    containerService.getSessionRepository(),
  );
}
