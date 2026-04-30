import type { AuthTokenResponse } from '@/core/communication/responses/auth';
import {
  IAuthIdentityRepository,
  IMembershipRepository,
  IPasswordHasher,
  ISessionRepository,
  ITokenProvider,
  IUserRepository,
} from '@/core/domain/contracts';
import { InvalidSetupTokenError, MemberNotFoundError, UserNotFoundError } from '@/core/errors';

export class SetupClientPasswordUseCase {
  constructor(
    private readonly tokenProvider: ITokenProvider,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly userRepository: IUserRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(
    setupToken: string,
    password: string,
    meta?: { ipAddress: string; userAgent: string; deviceId: string },
  ): Promise<AuthTokenResponse> {
    const payload = await this.tokenProvider.verifySetupToken(setupToken);

    if (payload.purpose !== 'password-setup') {
      throw new InvalidSetupTokenError();
    }

    const userId = payload.sub;

    const existingIdentity = await this.authIdentityRepository.findByUserIdAndProvider(userId, 'credentials');

    const passwordHash = await this.passwordHasher.hash(password);

    if (existingIdentity) {
      await this.authIdentityRepository.updatePasswordHash(existingIdentity.id, passwordHash);
    } else {
      await this.authIdentityRepository.create({
        provider: 'credentials',
        providerId: userId,
        passwordHash,
        userId,
      });
    }

    // After setting up password, create a session and return auth token
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const memberships = await this.membershipRepository.findByUser(user.id);
    if (memberships.length === 0) {
      throw new MemberNotFoundError();
    }

    const membership = memberships[0];
    const userType = 'client' as const;

    const token = await this.tokenProvider.signUserToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: membership.role,
      type: userType,
      organizationId: membership.organizationId,
    });

    // Create session if metadata is provided
    if (meta) {
      const tokenHash = await this.passwordHasher.hash(token.slice(-16));

      await this.sessionRepository.createUserSession({
        userId: user.id,
        tokenHash,
        deviceId: meta.deviceId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      });
    }

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: membership.role,
        type: userType,
        organizationId: membership.organizationId,
      },
    };
  }
}
