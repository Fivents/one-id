import { ISessionRepository } from '@/core/domain/contracts';

export class LogoutUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  /** Ends only the session behind the current token; other devices stay signed in. */
  async execute(sessionId: string): Promise<void> {
    await this.sessionRepository.revokeUserSession(sessionId);
  }
}
