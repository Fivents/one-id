import type { ISessionRepository, ITokenProvider, ITotemRepository } from '@/domain/auth';

import type { TotemAuthResponse } from '../communication/response/auth.response';

export class LoginWithAccessCodeTotemUseCase {
  constructor(
    private readonly totemRepository: ITotemRepository,
    private readonly tokenProvider: ITokenProvider,
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(accessCode: string, meta: { ipAddress: string; userAgent: string }): Promise<TotemAuthResponse> {
    const totem = await this.totemRepository.findByAccessCode(accessCode);

    if (!totem) {
      throw new TotemLoginError('Invalid access code.');
    }

    if (!totem.canAuthenticate()) {
      throw new TotemLoginError('Totem is not active. Contact your administrator.');
    }

    // Revoke any existing sessions — only one totem connected at a time
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
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for devices
    });

    return {
      token,
      totem: {
        id: totem.id,
        name: totem.name,
      },
    };
  }
}

export class TotemLoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TotemLoginError';
  }
}
