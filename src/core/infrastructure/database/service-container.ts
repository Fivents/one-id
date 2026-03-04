// ── Service Container with Lazy Initialization ──────────────────────

import type { PrismaClient } from '@/generated/prisma/client';

import { env } from '../environment/env';
import { prisma } from '../prisma-client';
import { BcryptPasswordHasher } from '../providers/bcrypt-password-hasher';
import { GoogleOAuthProvider } from '../providers/google-oauth.provider';
import { JoseTokenProvider } from '../providers/jose-token-provider';
import { PrismaAuthIdentityRepository } from '../repositories/prisma-auth-identity.repository';
import { PrismaSessionRepository } from '../repositories/prisma-session.repository';
import { PrismaTotemRepository } from '../repositories/prisma-totem.repository';
import { PrismaUserRepository } from '../repositories/prisma-user.repository';

/**
 * ServiceContainer manages singleton instances across the application.
 * Uses lazy initialization for better performance and dependency isolation.
 *
 * Following DDD principles:
 * - Repositories are instantiated once and reused
 * - Providers (hashers, token, oauth) are instantiated once
 * - Each dependency is independent and testable
 */
class ServiceContainer {
  private prismaClient: PrismaClient;
  private userRepository: PrismaUserRepository | null = null;
  private authIdentityRepository: PrismaAuthIdentityRepository | null = null;
  private totemRepository: PrismaTotemRepository | null = null;
  private sessionRepository: PrismaSessionRepository | null = null;
  private passwordHasher: BcryptPasswordHasher | null = null;
  private tokenProvider: JoseTokenProvider | null = null;
  private googleOAuthProvider: GoogleOAuthProvider | null = null;

  constructor(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
  }

  // ── Repositories ────────────────────────────────────────────────────

  getUserRepository(): PrismaUserRepository {
    if (!this.userRepository) {
      this.userRepository = new PrismaUserRepository(this.prismaClient);
    }
    return this.userRepository;
  }

  getAuthIdentityRepository(): PrismaAuthIdentityRepository {
    if (!this.authIdentityRepository) {
      this.authIdentityRepository = new PrismaAuthIdentityRepository(this.prismaClient);
    }
    return this.authIdentityRepository;
  }

  getTotemRepository(): PrismaTotemRepository {
    if (!this.totemRepository) {
      this.totemRepository = new PrismaTotemRepository(this.prismaClient);
    }
    return this.totemRepository;
  }

  getSessionRepository(): PrismaSessionRepository {
    if (!this.sessionRepository) {
      this.sessionRepository = new PrismaSessionRepository(this.prismaClient);
    }
    return this.sessionRepository;
  }

  // ── Providers ───────────────────────────────────────────────────────

  getPasswordHasher(): BcryptPasswordHasher {
    if (!this.passwordHasher) {
      this.passwordHasher = new BcryptPasswordHasher();
    }
    return this.passwordHasher;
  }

  getTokenProvider(): JoseTokenProvider {
    if (!this.tokenProvider) {
      this.tokenProvider = new JoseTokenProvider(env.JWT_SECRET);
    }
    return this.tokenProvider;
  }

  getGoogleOAuthProvider(): GoogleOAuthProvider {
    if (!this.googleOAuthProvider) {
      this.googleOAuthProvider = new GoogleOAuthProvider(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        `${env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      );
    }
    return this.googleOAuthProvider;
  }
}

// ── Singleton Instance ──────────────────────────────────────────────

const globalForContainer = globalThis as unknown as { serviceContainer: ServiceContainer };

export const serviceContainer = globalForContainer.serviceContainer || new ServiceContainer(prisma);

if (process.env.NODE_ENV !== 'production') {
  globalForContainer.serviceContainer = serviceContainer;
}
