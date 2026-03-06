import type { ResetPasswordResponse } from '@/core/communication/responses/admin';
import type { IAuthIdentityRepository, IPasswordHasher, IUserRepository } from '@/core/domain/contracts';
import { UserNotFoundError } from '@/core/errors';

export class ResetUserPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authIdentityRepository: IAuthIdentityRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(userId: string): Promise<ResetPasswordResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await this.passwordHasher.hash(temporaryPassword);

    const identity = await this.authIdentityRepository.findByUserIdAndProvider(userId, 'credentials');

    if (identity) {
      await this.authIdentityRepository.updatePasswordHash(identity.id, passwordHash);
    } else {
      await this.authIdentityRepository.create({
        provider: 'credentials',
        providerId: user.email,
        passwordHash,
        userId: user.id,
      });
    }

    return { temporaryPassword };
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    const array = new Uint32Array(12);
    crypto.getRandomValues(array);
    for (let i = 0; i < 12; i++) {
      password += chars[array[i] % chars.length];
    }
    return password;
  }
}
