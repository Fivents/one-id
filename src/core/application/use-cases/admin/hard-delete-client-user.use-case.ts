import type { IMembershipRepository, IUserRepository } from '@/core/domain/contracts';
import { UserNotFoundError } from '@/core/errors';

export class HardDeleteClientUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly membershipRepository: IMembershipRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepository.findByIdIncludingDeleted(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }

    await this.membershipRepository.hardDeleteByUserId(id);
    await this.userRepository.hardDelete(id);
  }
}
