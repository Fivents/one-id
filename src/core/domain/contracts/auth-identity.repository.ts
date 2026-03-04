import type { AuthIdentityEntity } from '../entities/auth-identity.entity';

export interface IAuthIdentityRepository {
  findByUserIdAndProvider(userId: string, provider: string): Promise<AuthIdentityEntity | null>;
  findByProviderAndProviderId(provider: string, providerId: string): Promise<AuthIdentityEntity | null>;
  create(data: {
    provider: string;
    providerId: string;
    passwordHash?: string;
    userId: string;
  }): Promise<AuthIdentityEntity>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
}
