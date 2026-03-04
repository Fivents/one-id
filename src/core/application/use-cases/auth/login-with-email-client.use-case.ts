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
      throw new LoginEmailError('Invalid credentials.');
    }

    if (!isClientRole(user.role)) {
      throw new LoginEmailError('This login method is not available for your account type.');
    }

    const identity = await this.authIdentityRepository.findByUserIdAndProvider(user.id, 'credentials');

    if (!identity || !identity.isPasswordConfigured()) {
      throw new LoginEmailError('Password not configured. Please set up your password first.');
    }

    if (!identity.isAccessAllowed()) {
      throw new LoginEmailError('Your access has been disabled. Contact your administrator.');
    }

    const isValid = await this.passwordHasher.compare(request.password, identity.passwordHash!);

    if (!isValid) {
      throw new LoginEmailError('Invalid credentials.');
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

export class LoginEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoginEmailError';
  }
}
