import { AuthTokenResponse } from '@/core/communication/responses/auth/auth.response';
import {
  IAuthIdentityRepository,
  IGoogleOAuthProvider,
  IPasswordHasher,
  ISessionRepository,
  ITokenProvider,
  IUserRepository,
} from '@/core/domain/contracts';
import { isAdminRole } from '@/core/domain/value-objects';
import { UnauthorizedError } from '@/core/errors';

import { AdminDomainService } from '../../services/admin-domain.service';

export class LoginWithGoogleAdminUseCase {
  constructor(
    private readonly googleOAuth: IGoogleOAuthProvider,
    private readonly userRepository: IUserRepository,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly tokenProvider: ITokenProvider,
    private readonly passwordHasher: IPasswordHasher,
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(
    code: string,
    meta: { ipAddress: string; userAgent: string; deviceId: string },
  ): Promise<AuthTokenResponse> {
    const googleUser = await this.googleOAuth.exchangeCodeForUserInfo(code);

    AdminDomainService.validateAdminEmail(googleUser.email);

    let user = await this.userRepository.findByEmail(googleUser.email);

    if (!user) {
      user = await this.userRepository.create({
        name: googleUser.name,
        email: googleUser.email,
        avatarUrl: googleUser.picture,
      });
    }

    let userWithMembership = await this.userRepository.findByEmailWithMembership(googleUser.email);

    // Auto-create membership for new @fivents.com admins (no membership yet)
    if (!userWithMembership) {
      const fiventsOrg = await this.userRepository.findOrCreateFiventsOrganization();
      await this.userRepository.createMembership({
        userId: user.id,
        organizationId: fiventsOrg.id,
        role: 'SUPER_ADMIN',
      });
      userWithMembership = await this.userRepository.findByEmailWithMembership(googleUser.email);
    }

    if (!userWithMembership || !isAdminRole(userWithMembership.role)) {
      throw new UnauthorizedError('Account is not authorized as admin.');
    }

    const existingIdentity = await this.authIdentityRepository.findByProviderAndProviderId('google', googleUser.id);

    if (!existingIdentity) {
      await this.authIdentityRepository.create({
        provider: 'google',
        providerId: googleUser.id,
        userId: user.id,
      });
    }

    const token = await this.tokenProvider.signUserToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: userWithMembership.role,
      type: 'admin',
      organizationId: userWithMembership.organizationId,
    });

    const tokenHash = await this.passwordHasher.hash(token.slice(-16));

    await this.sessionRepository.createUserSession({
      userId: user.id,
      tokenHash,
      deviceId: meta.deviceId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userWithMembership.role,
        type: 'admin',
        organizationId: userWithMembership.organizationId,
      },
    };
  }
}
