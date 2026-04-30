import type { IMembershipRepository, IUserRepository } from '@/core/domain/contracts';
import { UserNotFoundError } from '@/core/errors';

export class DeleteClientUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly membershipRepository: IMembershipRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }

    await this.membershipRepository.softDeleteByUserId(id);
    await this.userRepository.softDelete(id);
  }
}
