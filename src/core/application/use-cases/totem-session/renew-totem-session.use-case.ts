import { ISessionRepository, ITokenProvider, ITotemRepository } from '@/core/domain/contracts';
import { TotemAccessDeniedError, TotemNotFoundError } from '@/core/errors';

export class RenewTotemSessionUseCase {
  constructor(
    private readonly totemRepository: ITotemRepository,
    private readonly tokenProvider: ITokenProvider,
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(totemId: string, meta: { ipAddress: string; userAgent: string }): Promise<{ token: string }> {
    const totem = await this.totemRepository.findById(totemId);

    if (!totem) {
      throw new TotemNotFoundError(totemId);
    }

    if (!totem.canAuthenticate()) {
      throw new TotemAccessDeniedError(totemId);
    }

    await this.sessionRepository.revokeTotemSessions(totem.id);

    const token = await this.tokenProvider.signTotemToken({
      sub: totem.id,
      name: totem.name,
      type: 'totem',
    });

    await this.sessionRepository.createTotemSession({
      totemId: totem.id,
      tokenHash: token.slice(-16),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return { token };
  }
}
