import { ISessionRepository } from '@/core/domain/contracts';

export class LogoutUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(userId: string): Promise<void> {
    await this.sessionRepository.revokeUserSessions(userId);
  }
}
