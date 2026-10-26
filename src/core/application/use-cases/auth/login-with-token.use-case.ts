import { AuthTokenResponse } from '@/core/communication/responses/auth/auth.response';
import { ISessionRepository, ITokenProvider, IUserRepository } from '@/core/domain/contracts';
import { UserNotFoundError } from '@/core/errors';

import { issueUserSession, verifyUserSession } from '../../services/user-session';

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
    const deps = { tokenProvider: this.tokenProvider, sessionRepository: this.sessionRepository };
    const payload = await verifyUserSession(deps, token);

    const user = await this.userRepository.findByEmailWithMembership(payload.email);

    if (!user) {
      throw new UserNotFoundError();
    }

    const newToken = await issueUserSession(
      deps,
      {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        type: payload.type,
        organizationId: user.organizationId,
      },
      meta,
    );

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
