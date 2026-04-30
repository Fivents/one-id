import { IUserRepository } from '@/core/domain/contracts';
import type { UserEntity } from '@/core/domain/entities';
import { UserAlreadyExistsError, UserNotFoundError } from '@/core/errors';

export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string, data: { name?: string; email?: string; avatarUrl?: string }): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UserNotFoundError(id);
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.userRepository.findByEmail(data.email);
      if (existing) {
        throw new UserAlreadyExistsError(data.email);
      }
    }

    return this.userRepository.update(id, data);
  }
}
