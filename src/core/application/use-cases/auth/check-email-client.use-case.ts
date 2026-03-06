import { CheckEmailResponse } from '@/core/communication/responses/auth/auth.response';
import {
  IAuthIdentityRepository,
  IMembershipRepository,
  ITokenProvider,
  IUserRepository,
} from '@/core/domain/contracts';
import { isClientRole } from '@/core/domain/value-objects';
import {
  AccessDisabledError,
  LoginMethodUnavailableError,
  MemberNotFoundError,
  UserNotFoundError,
} from '@/core/errors';

export class CheckEmailClientUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly tokenProvider: ITokenProvider,
    private readonly membershipRepository: IMembershipRepository,
  ) {}

  async execute(email: string): Promise<CheckEmailResponse> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UserNotFoundError();
    }

    const memberships = await this.membershipRepository.findByUser(user.id);

    if (memberships.length === 0) {
      throw new MemberNotFoundError();
    }

    if (!isClientRole(memberships[0].role)) {
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
