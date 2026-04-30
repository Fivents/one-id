import { IMembershipRepository } from '@/core/domain/contracts';
import { MemberNotFoundError } from '@/core/errors';

export class RemoveMemberUseCase {
  constructor(private readonly membershipRepository: IMembershipRepository) {}

  async execute(membershipId: string): Promise<void> {
    const membership = await this.membershipRepository.findById(membershipId);

    if (!membership) {
      throw new MemberNotFoundError(membershipId);
    }

    await this.membershipRepository.softDelete(membershipId);
  }
}
