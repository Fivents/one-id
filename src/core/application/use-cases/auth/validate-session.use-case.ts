import type { UserTokenPayload } from '@/core/domain/contracts';
import { ISessionRepository, ITokenProvider } from '@/core/domain/contracts';

import { verifyUserSession } from '../../services/user-session';

export class ValidateSessionUseCase {
  constructor(
    private readonly tokenProvider: ITokenProvider,
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(token: string): Promise<UserTokenPayload> {
    return verifyUserSession({ tokenProvider: this.tokenProvider, sessionRepository: this.sessionRepository }, token);
  }
}
