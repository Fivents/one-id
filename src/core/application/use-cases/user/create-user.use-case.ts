import { IUserRepository } from '@/core/domain/contracts';
import type { UserEntity } from '@/core/domain/entities';

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(data: { name: string; email: string; avatarUrl?: string }): Promise<UserEntity> {
    const existing = await this.userRepository.findByEmail(data.email);

    if (existing) {
      throw new CreateUserError('A user with this email already exists.');
    }

    return this.userRepository.create(data);
  }
}

export class CreateUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreateUserError';
  }
}
