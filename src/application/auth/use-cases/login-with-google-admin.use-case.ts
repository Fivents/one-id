import type {
  IAuthIdentityRepository,
  IGoogleOAuthProvider,
  ISessionRepository,
  ITokenProvider,
  IUserRepository,
} from '@/domain/auth';
import { AdminDomainService, isAdminRole } from '@/domain/auth';

import type { AuthTokenResponse } from '../communication/response/auth.response';

export class LoginWithGoogleAdminUseCase {
  constructor(
    private readonly googleOAuth: IGoogleOAuthProvider,
    private readonly userRepository: IUserRepository,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly tokenProvider: ITokenProvider,
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

    const userWithMembership = await this.userRepository.findByEmailWithMembership(googleUser.email);

    if (!userWithMembership || !isAdminRole(userWithMembership.role)) {
      throw new GoogleAdminLoginError('Account is not authorized as admin.');
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

    await this.sessionRepository.createUserSession({
      userId: user.id,
      tokenHash: token.slice(-16),
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

export class GoogleAdminLoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleAdminLoginError';
  }
}
