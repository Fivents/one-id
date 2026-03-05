import { CheckEmailResponse } from '@/core/communication/responses/auth/auth.response';
import { IAuthIdentityRepository, ITokenProvider, IUserRepository } from '@/core/domain/contracts';
import { isClientRole } from '@/core/domain/value-objects';
import { AccessDisabledError, LoginMethodUnavailableError, UserNotFoundError } from '@/core/errors';

export class CheckEmailClientUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly tokenProvider: ITokenProvider,
  ) {}

  async execute(email: string): Promise<CheckEmailResponse> {
    const user = await this.userRepository.findByEmailWithMembership(email);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (!isClientRole(user.role)) {
      throw new LoginMethodUnavailableError({ email });
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
      throw new AccessDisabledError({ userId: user.id });
    }

    return { status: 'ready' };
  }
}
