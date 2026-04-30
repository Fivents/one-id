import type { IAuthIdentityRepository, IUserRepository } from '@/core/domain/contracts';
import { UserNotFoundError } from '@/core/errors';

export class ResetUserPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authIdentityRepository: IAuthIdentityRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const identity = await this.authIdentityRepository.findByUserIdAndProvider(userId, 'credentials');

    if (identity) {
      await this.authIdentityRepository.updatePasswordHash(identity.id, null);
    }
  }
}
