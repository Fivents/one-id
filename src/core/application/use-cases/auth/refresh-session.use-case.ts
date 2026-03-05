import { AuthTokenResponse } from '@/core/communication/responses/auth/auth.response';
import { IPasswordHasher, ISessionRepository, ITokenProvider, IUserRepository } from '@/core/domain/contracts';

export class RefreshSessionUseCase {
  constructor(
    private readonly tokenProvider: ITokenProvider,
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(
    currentToken: string,
    meta: { ipAddress: string; userAgent: string; deviceId: string },
  ): Promise<AuthTokenResponse> {
    const payload = await this.tokenProvider.verifyUserToken(currentToken);

    const user = await this.userRepository.findByEmailWithMembership(payload.email);

    if (!user) {
      throw new RefreshSessionError('User not found.');
    }

    const newToken = await this.tokenProvider.signUserToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      type: payload.type,
      organizationId: user.organizationId,
    });

    const tokenHash = await this.passwordHasher.hash(newToken.slice(-16));

    await this.sessionRepository.createUserSession({
      userId: user.id,
      tokenHash,
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

export class RefreshSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RefreshSessionError';
  }
}
