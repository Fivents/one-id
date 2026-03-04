import { CheckEmailResponse } from '@/core/communication/responses/auth/auth.response';
import { IAuthIdentityRepository, ITokenProvider, IUserRepository } from '@/core/domain/contracts';
import { isClientRole } from '@/core/domain/value-objects';

export class CheckEmailClientUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly tokenProvider: ITokenProvider,
  ) {}

  async execute(email: string): Promise<CheckEmailResponse> {
    const user = await this.userRepository.findByEmailWithMembership(email);

    if (!user) {
      throw new CheckEmailError('User not found.');
    }

    if (!isClientRole(user.role)) {
      throw new CheckEmailError('This login method is not available for your account type.');
    }

    const identity = await this.authIdentityRepository.findByUserIdAndProvider(user.id, 'credentials');

    if (!identity || !identity.isPasswordConfigured()) {
      const setupToken = await this.tokenProvider.signSetupToken({
        sub: user.id,
        purpose: 'password-setup',
      });
      return { status: 'needs_setup', setupToken };
    }

    if (!identity.isAccessAllowed()) {
      throw new CheckEmailError('Your access has been disabled. Contact your administrator.');
    }

    return { status: 'ready' };
  }
}

export class CheckEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckEmailError';
  }
}
