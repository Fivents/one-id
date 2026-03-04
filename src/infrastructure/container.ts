import { CheckEmailClientUseCase } from '@/application/auth/use-cases/check-email-client.use-case';
import { LoginWithAccessCodeTotemUseCase } from '@/application/auth/use-cases/login-with-access-code-totem.use-case';
import { LoginWithEmailClientUseCase } from '@/application/auth/use-cases/login-with-email-client.use-case';
import { LoginWithGoogleAdminUseCase } from '@/application/auth/use-cases/login-with-google-admin.use-case';
import { SetupClientPasswordUseCase } from '@/application/auth/use-cases/setup-client-password.use-case';
import { env } from '@/lib/environment/env';

import { BcryptPasswordHasher } from './auth/bcrypt-password-hasher';
import { GoogleOAuthProvider } from './auth/google-oauth.provider';
import { JoseTokenProvider } from './auth/jose-token-provider';
import { prisma } from './database/prisma-client';
import { PrismaAuthIdentityRepository } from './database/repositories/prisma-auth-identity.repository';
import { PrismaSessionRepository } from './database/repositories/prisma-session.repository';
import { PrismaTotemRepository } from './database/repositories/prisma-totem.repository';
import { PrismaUserRepository } from './database/repositories/prisma-user.repository';

// ── Singleton Infrastructure Instances ──────────────────────────────

const userRepository = new PrismaUserRepository(prisma);
const authIdentityRepository = new PrismaAuthIdentityRepository(prisma);
const totemRepository = new PrismaTotemRepository(prisma);
const sessionRepository = new PrismaSessionRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();
const tokenProvider = new JoseTokenProvider(env.JWT_SECRET);
const googleOAuthProvider = new GoogleOAuthProvider(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  `${env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
);

// ── Use Case Factories ──────────────────────────────────────────────

export function makeCheckEmailClientUseCase(): CheckEmailClientUseCase {
  return new CheckEmailClientUseCase(userRepository, authIdentityRepository, tokenProvider);
}

export function makeLoginWithEmailClientUseCase(): LoginWithEmailClientUseCase {
  return new LoginWithEmailClientUseCase(
    userRepository,
    authIdentityRepository,
    passwordHasher,
    tokenProvider,
    sessionRepository,
  );
}

export function makeLoginWithGoogleAdminUseCase(): LoginWithGoogleAdminUseCase {
  return new LoginWithGoogleAdminUseCase(
    googleOAuthProvider,
    userRepository,
    authIdentityRepository,
    tokenProvider,
    sessionRepository,
  );
}

export function makeSetupClientPasswordUseCase(): SetupClientPasswordUseCase {
  return new SetupClientPasswordUseCase(tokenProvider, authIdentityRepository, passwordHasher);
}

export function makeLoginWithAccessCodeTotemUseCase(): LoginWithAccessCodeTotemUseCase {
  return new LoginWithAccessCodeTotemUseCase(totemRepository, tokenProvider, sessionRepository);
}

export function getGoogleOAuthProvider(): GoogleOAuthProvider {
  return googleOAuthProvider;
}
