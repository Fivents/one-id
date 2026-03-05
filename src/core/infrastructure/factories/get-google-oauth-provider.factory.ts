import { containerService } from '@/core/application/services';
import { IGoogleOAuthProvider } from '@/core/domain/contracts';

/**
 * Get configured GoogleOAuthProvider singleton
 *
 * Returns a single instance of GoogleOAuthProvider with configuration
 * for OAuth flow: state generation, URL building, and code exchange.
 */
export function getGoogleOAuthProvider(): IGoogleOAuthProvider {
  return containerService.getGoogleOAuthProvider();
}
