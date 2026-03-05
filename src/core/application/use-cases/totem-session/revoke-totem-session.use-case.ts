import { ISessionRepository } from '@/core/domain/contracts';

export class RevokeTotemSessionUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(totemId: string): Promise<void> {
    await this.sessionRepository.revokeTotemSessions(totemId);
  }
}
