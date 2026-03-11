import { TotemAuthResponse } from '@/core/communication/responses/auth/auth.response';
import { IPasswordHasher, ISessionRepository, ITokenProvider, ITotemRepository } from '@/core/domain/contracts';
import { InvalidAccessCodeError, TotemAccessDeniedError } from '@/core/errors';

export class LoginWithAccessCodeTotemUseCase {
  constructor(
    private readonly totemRepository: ITotemRepository,
    private readonly tokenProvider: ITokenProvider,
    private readonly passwordHasher: IPasswordHasher,
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(accessCode: string, meta: { ipAddress: string; userAgent: string }): Promise<TotemAuthResponse> {
    const totem = await this.totemRepository.findByAccessCode(accessCode);

    if (!totem) {
      throw new InvalidAccessCodeError();
    }

    if (!totem.canAuthenticate()) {
      throw new TotemAccessDeniedError(totem.id);
    }

    // Revoke any existing sessions — only one totem connected at a time
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
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for devices
    });

    // Set totem status to ACTIVE upon successful login
    await this.totemRepository.update(totem.id, { status: 'ACTIVE' });

    return {
      token,
      totem: {
        id: totem.id,
        name: totem.name,
      },
    };
  }
}
