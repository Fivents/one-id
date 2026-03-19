import { IPasswordHasher, ISessionRepository, ITokenProvider, ITotemRepository } from '@/core/domain/contracts';
import { TotemAccessDeniedError, TotemNotFoundError } from '@/core/errors';
import { env } from '@/core/infrastructure/environment/env';

export class RenewTotemSessionUseCase {
  constructor(
    private readonly totemRepository: ITotemRepository,
    private readonly tokenProvider: ITokenProvider,
    private readonly sessionRepository: ISessionRepository,
    private readonly passwordHasher: IPasswordHasher,
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

    const tokenHash = await this.passwordHasher.hash(token.slice(-16));

    await this.sessionRepository.createTotemSession({
      totemId: totem.id,
      tokenHash,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      expiresAt: new Date(Date.now() + env.TOTEM_SESSION_TIMEOUT_MS),
    });

    return { token };
  }
}
