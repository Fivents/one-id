import { ISessionRepository, ITokenProvider } from '@/core/domain/contracts';

export class ValidateTotemSessionUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly tokenProvider: ITokenProvider,
  ) {}

  async execute(token: string): Promise<{ totemId: string; sessionId: string }> {
    const payload = await this.tokenProvider.verifyTotemToken(token).catch(() => {
      throw new ValidateTotemSessionError('Invalid totem token.');
    });

    const session = await this.sessionRepository.findTotemSessionById(payload.sub);

    if (!session) {
      throw new ValidateTotemSessionError('Totem session not found.');
    }

    if (new Date() >= session.expiresAt) {
      throw new ValidateTotemSessionError('Totem session has expired.');
    }

    return { totemId: session.totemId, sessionId: session.id };
  }
}

export class ValidateTotemSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidateTotemSessionError';
  }
}
