import { IUserRepository } from '@/core/domain/contracts';
import type { UserEntity } from '@/core/domain/entities';
import { UserNotFoundError } from '@/core/errors';

export class GetUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  }
}
