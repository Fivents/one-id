import { TotemAuthResponse } from '@/core/communication/responses/auth/auth.response';
import {
  IAuditLogRepository,
  IPasswordHasher,
  ISessionRepository,
  ITokenProvider,
  ITotemRepository,
} from '@/core/domain/contracts';
import { InvalidAccessCodeError, TotemAccessDeniedError } from '@/core/errors';
import { env } from '@/core/infrastructure/environment/env';

export class LoginWithAccessCodeTotemUseCase {
  constructor(
    private readonly totemRepository: ITotemRepository,
    private readonly tokenProvider: ITokenProvider,
    private readonly passwordHasher: IPasswordHasher,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(accessCode: string, meta: { ipAddress: string; userAgent: string }): Promise<TotemAuthResponse> {
    const totem = await this.totemRepository.findByAccessCode(accessCode);

    if (!totem) {
      await this.logAudit('TOTEM_AUTH_FAILED', 'Invalid access code.', {
        ipAddress: meta.ipAddress,
        reason: 'INVALID_ACCESS_CODE',
      });
      throw new InvalidAccessCodeError();
    }

    if (!totem.canAuthenticate()) {
      await this.logAudit('TOTEM_AUTH_FAILED', `Totem ${totem.name} access denied.`, {
        totemId: totem.id,
        ipAddress: meta.ipAddress,
        reason: 'TOTEM_ACCESS_DENIED',
      });
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
      expiresAt: new Date(Date.now() + env.TOTEM_SESSION_TIMEOUT_MS),
    });

    // Set totem status to ACTIVE upon successful login
    await this.totemRepository.update(totem.id, { status: 'ACTIVE' });

    await this.logAudit('TOTEM_AUTH_SUCCESS', `Totem ${totem.name} authenticated successfully.`, {
      totemId: totem.id,
      totemName: totem.name,
      ipAddress: meta.ipAddress,
    });

    return {
      token,
      totem: {
        id: totem.id,
        name: totem.name,
      },
    };
  }

  private async logAudit(
    action: 'TOTEM_AUTH' | 'TOTEM_AUTH_SUCCESS' | 'TOTEM_AUTH_FAILED',
    description: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.auditLogRepository.create({ action, description, metadata });
    } catch {
      // Audit logging should never block the auth flow
      console.error(`[TotemAuth] Failed to log audit: ${action}`);
    }
  }
}
