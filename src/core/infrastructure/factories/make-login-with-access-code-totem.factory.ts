import { containerService } from '@/core/application/services';
import { LoginWithAccessCodeTotemUseCase } from '@/core/application/use-cases/auth/login-with-access-code-totem.use-case';

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
    containerService.getTotemRepository(),
    containerService.getTokenProvider(),
    containerService.getSessionRepository(),
  );
}
