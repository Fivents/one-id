import { ISessionRepository } from '@/core/domain/contracts';
import { SessionNotFoundError } from '@/core/errors';

export class RevokeSessionUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findUserSessionById(sessionId);

    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    await this.sessionRepository.revokeUserSession(sessionId);
  }
}
