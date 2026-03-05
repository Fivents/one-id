import { IUserRepository } from '@/core/domain/contracts';
import type { UserEntity } from '@/core/domain/entities';

export class GetUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new GetUserError('User not found.');
    }

    return user;
  }
}

export class GetUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetUserError';
  }
}
