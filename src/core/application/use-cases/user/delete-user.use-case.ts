import { IUserRepository } from '@/core/domain/contracts';
import { UserNotFoundError } from '@/core/errors';

export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UserNotFoundError(id);
    }

    await this.userRepository.softDelete(id);
  }
}
