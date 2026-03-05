import { ISessionRepository } from '@/core/domain/contracts';

export class ListUserSessionsUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(userId: string) {
    return this.sessionRepository.findUserSessionsByUserId(userId);
  }
}
