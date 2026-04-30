import { AuthTokenResponse } from '@/core/communication/responses/auth/auth.response';
import { ISessionRepository, ITokenProvider, IUserRepository } from '@/core/domain/contracts';
import { UserNotFoundError } from '@/core/errors';

export class LoginWithTokenUseCase {
  constructor(
    private readonly tokenProvider: ITokenProvider,
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(
    token: string,
    meta: { ipAddress: string; userAgent: string; deviceId: string },
  ): Promise<AuthTokenResponse> {
    const payload = await this.tokenProvider.verifyUserToken(token);

    const user = await this.userRepository.findByEmailWithMembership(payload.email);

    if (!user) {
      throw new UserNotFoundError();
    }

    const newToken = await this.tokenProvider.signUserToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      type: payload.type,
      organizationId: user.organizationId,
    });

    await this.sessionRepository.createUserSession({
      userId: user.id,
      tokenHash: newToken.slice(-16),
      deviceId: meta.deviceId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return {
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        type: payload.type,
        organizationId: user.organizationId,
      },
    };
  }
}
