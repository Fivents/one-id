// ── Singleton Infrastructure Instances ──────────────────────────────

import { CheckEmailClientUseCase } from '@/core/application/use-cases/auth/check-email-client.use-case';
import { LoginWithAccessCodeTotemUseCase } from '@/core/application/use-cases/auth/login-with-access-code-totem.use-case';
import { LoginWithEmailClientUseCase } from '@/core/application/use-cases/auth/login-with-email-client.use-case';
import { LoginWithGoogleAdminUseCase } from '@/core/application/use-cases/auth/login-with-google-admin.use-case';
import { SetupClientPasswordUseCase } from '@/core/application/use-cases/auth/setup-client-password.use-case';

import { env } from '../environment/env';
import { BcryptPasswordHasher } from '../providers/bcrypt-password-hasher';
import { GoogleOAuthProvider } from '../providers/google-oauth.provider';
import { JoseTokenProvider } from '../providers/jose-token-provider';

import { PrismaAuthIdentityRepository } from './repositories/prisma-auth-identity.repository';
import { PrismaSessionRepository } from './repositories/prisma-session.repository';
import { PrismaTotemRepository } from './repositories/prisma-totem.repository';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { prisma } from './prisma-client';

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
