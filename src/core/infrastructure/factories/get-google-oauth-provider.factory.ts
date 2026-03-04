import { IGoogleOAuthProvider } from '@/core/domain/contracts';

import { serviceContainer } from '../database/service-container';

/**
 * Get configured GoogleOAuthProvider singleton
 *
 * Returns a single instance of GoogleOAuthProvider with configuration
 * for OAuth flow: state generation, URL building, and code exchange.
 */
export function getGoogleOAuthProvider(): IGoogleOAuthProvider {
  return serviceContainer.getGoogleOAuthProvider();
}
