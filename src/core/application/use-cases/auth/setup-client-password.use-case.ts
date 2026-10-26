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

import { issueUserSession } from '../../services/user-session';

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

    // Always backed by a session: a token without one is rejected by every authenticated route.
    const token = await issueUserSession(
      { tokenProvider: this.tokenProvider, sessionRepository: this.sessionRepository },
      {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: membership.role,
        type: userType,
        organizationId: membership.organizationId,
      },
      meta ?? { deviceId: 'unknown', ipAddress: 'unknown', userAgent: 'unknown' },
    );

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
