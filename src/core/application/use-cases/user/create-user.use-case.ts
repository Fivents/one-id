import { IUserRepository } from '@/core/domain/contracts';
import type { UserEntity } from '@/core/domain/entities';
import { UserAlreadyExistsError } from '@/core/errors';

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(data: { name: string; email: string; avatarUrl?: string }): Promise<UserEntity> {
    const existing = await this.userRepository.findByEmail(data.email);

    if (existing) {
      throw new UserAlreadyExistsError(data.email);
    }

    return this.userRepository.create(data);
  }
}
