import { ISessionRepository } from '@/core/domain/contracts';

export class LogoutUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(sessionId: string): Promise<void> {
    await this.sessionRepository.revokeUserSession(sessionId);
  }
}
