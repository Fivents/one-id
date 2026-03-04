/**
 * Factories - Use Case Instantiation Layer
 *
 * This directory contains factory functions that instantiate use cases with
 * their dependencies injected from the ServiceContainer.
 *
 * Each factory is a pure function that:
 * 1. Retrieves lazy-loaded singletons from ServiceContainer
 * 2. Instantiates the use case with those dependencies
 * 3. Returns a ready-to-use use case instance
 *
 * Pattern: Factory Method with lazy singleton management
 * Principle: Single Responsibility + Dependency Inversion (DIP)
 */

export { getGoogleOAuthProvider } from './get-google-oauth-provider.factory';
export { makeCheckEmailClientUseCase } from './make-check-email-client.factory';
export { makeLoginWithAccessCodeTotemUseCase } from './make-login-with-access-code-totem.factory';
export { makeLoginWithEmailClientUseCase } from './make-login-with-email-client.factory';
export { makeLoginWithGoogleAdminUseCase } from './make-login-with-google-admin.factory';
export { makeSetupClientPasswordUseCase } from './make-setup-client-password.factory';
