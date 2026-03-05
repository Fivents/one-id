import { ISessionRepository, ITokenProvider } from '@/core/domain/contracts';
import { TotemSessionExpiredError, TotemSessionNotFoundError, UnauthorizedError } from '@/core/errors';

export class ValidateTotemSessionUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly tokenProvider: ITokenProvider,
  ) {}

  async execute(token: string): Promise<{ totemId: string; sessionId: string }> {
    const payload = await this.tokenProvider.verifyTotemToken(token).catch(() => {
      throw new UnauthorizedError();
    });

    const session = await this.sessionRepository.findTotemSessionById(payload.sub);

    if (!session) {
      throw new TotemSessionNotFoundError(payload.sub);
    }

    if (new Date() >= session.expiresAt) {
      throw new TotemSessionExpiredError(session.id);
    }

    return { totemId: session.totemId, sessionId: session.id };
  }
}
