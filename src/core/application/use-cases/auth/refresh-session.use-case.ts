import { AuthTokenResponse } from '@/core/communication/responses/auth/auth.response';
import { ISessionRepository, ITokenProvider, IUserRepository } from '@/core/domain/contracts';
import { UserNotFoundError } from '@/core/errors';

import { issueUserSession, verifyUserSession } from '../../services/user-session';

const REFRESH_GRACE_MS = 30_000;

export class RefreshSessionUseCase {
  constructor(
    private readonly tokenProvider: ITokenProvider,
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(
    currentToken: string,
    meta: { ipAddress: string; userAgent: string; deviceId: string },
  ): Promise<AuthTokenResponse> {
    const deps = { tokenProvider: this.tokenProvider, sessionRepository: this.sessionRepository };
    const payload = await verifyUserSession(deps, currentToken);

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

    // Rotate: the old session is retired so refreshes never multiply live sessions. A short
    // grace keeps a second tab that refreshes with the same cookie at the same moment from
    // being logged out; after it, the old token is dead.
    if (payload.sid) {
      await this.sessionRepository.expireUserSessionAt(payload.sid, new Date(Date.now() + REFRESH_GRACE_MS));
    }

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
