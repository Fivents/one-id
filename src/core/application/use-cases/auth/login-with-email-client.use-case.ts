import { LoginEmailRequest } from '@/core/communication/requests/auth/login-email.request';
import { AuthTokenResponse } from '@/core/communication/responses/auth/auth.response';
import {
  IAuthIdentityRepository,
  IPasswordHasher,
  ISessionRepository,
  ITokenProvider,
  IUserRepository,
} from '@/core/domain/contracts';
import { isClientRole } from '@/core/domain/value-objects';
import {
  AccessDisabledError,
  InvalidCredentialsError,
  LoginMethodUnavailableError,
  PasswordNotConfiguredError,
} from '@/core/errors';

export class LoginWithEmailClientUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenProvider: ITokenProvider,
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async execute(
    request: LoginEmailRequest,
    meta: { ipAddress: string; userAgent: string; deviceId: string },
  ): Promise<AuthTokenResponse> {
    const user = await this.userRepository.findByEmailWithMembership(request.email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!isClientRole(user.role)) {
      throw new LoginMethodUnavailableError({ email: request.email });
    }

    const identity = await this.authIdentityRepository.findByUserIdAndProvider(user.id, 'credentials');

    if (!identity || !identity.isPasswordConfigured()) {
      throw new PasswordNotConfiguredError({ userId: user.id });
    }

    if (!identity.isAccessAllowed()) {
      throw new AccessDisabledError({ userId: user.id });
    }

    const isValid = await this.passwordHasher.compare(request.password, identity.passwordHash!);

    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const userType = 'client' as const;

    const token = await this.tokenProvider.signUserToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      type: userType,
      organizationId: user.organizationId,
    });

    const tokenHash = await this.passwordHasher.hash(token.slice(-16));

    await this.sessionRepository.createUserSession({
      userId: user.id,
      tokenHash,
      deviceId: meta.deviceId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        type: userType,
        organizationId: user.organizationId,
      },
    };
  }
}
