import { IUserRepository } from '@/core/domain/contracts';
import type { UserEntity } from '@/core/domain/entities';

export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string, data: { name?: string; email?: string; avatarUrl?: string }): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UpdateUserError('User not found.');
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.userRepository.findByEmail(data.email);
      if (existing) {
        throw new UpdateUserError('A user with this email already exists.');
      }
    }

    return this.userRepository.update(id, data);
  }
}

export class UpdateUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdateUserError';
  }
}
