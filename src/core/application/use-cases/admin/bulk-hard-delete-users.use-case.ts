import type { IMembershipRepository, IUserRepository } from '@/core/domain/contracts';

export class BulkHardDeleteUsersUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly membershipRepository: IMembershipRepository,
  ) {}

  async execute(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.membershipRepository.hardDeleteByUserId(id);
    }
    await this.userRepository.hardDeleteMany(ids);
  }
}
