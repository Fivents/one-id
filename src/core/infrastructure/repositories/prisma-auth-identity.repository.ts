import { IAuthIdentityRepository } from '@/core/domain/contracts';
import { AuthIdentityEntity } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaAuthIdentityRepository implements IAuthIdentityRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUserIdAndProvider(userId: string, provider: string): Promise<AuthIdentityEntity | null> {
    const identity = await this.db.authIdentity.findFirst({
      where: { userId, provider, deletedAt: null },
    });

    if (!identity) return null;

    return AuthIdentityEntity.create({
      id: identity.id,
      provider: identity.provider,
      providerId: identity.providerId,
      passwordHash: identity.passwordHash,
      allowAccess: identity.allowAccess,
      userId: identity.userId,
    });
  }

  async findByProviderAndProviderId(provider: string, providerId: string): Promise<AuthIdentityEntity | null> {
    const identity = await this.db.authIdentity.findUnique({
      where: {
        provider_providerId: { provider, providerId },
        deletedAt: null,
      },
    });

    if (!identity) return null;

    return AuthIdentityEntity.create({
      id: identity.id,
      provider: identity.provider,
      providerId: identity.providerId,
      passwordHash: identity.passwordHash,
      allowAccess: identity.allowAccess,
      userId: identity.userId,
    });
  }

  async create(data: {
    provider: string;
    providerId: string;
    passwordHash?: string;
    userId: string;
  }): Promise<AuthIdentityEntity> {
    const identity = await this.db.authIdentity.create({
      data: {
        provider: data.provider,
        providerId: data.providerId,
        passwordHash: data.passwordHash,
        userId: data.userId,
      },
    });

    return AuthIdentityEntity.create({
      id: identity.id,
      provider: identity.provider,
      providerId: identity.providerId,
      passwordHash: identity.passwordHash,
      allowAccess: identity.allowAccess,
      userId: identity.userId,
    });
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.db.authIdentity.update({
      where: { id },
      data: { passwordHash },
    });
  }
}
