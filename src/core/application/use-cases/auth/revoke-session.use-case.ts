import { ISessionRepository } from '@/core/domain/contracts';

export class RevokeSessionUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findUserSessionById(sessionId);

    if (!session) {
      throw new RevokeSessionError('Session not found.');
    }

    await this.sessionRepository.revokeUserSession(sessionId);
  }
}

export class RevokeSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RevokeSessionError';
  }
}
