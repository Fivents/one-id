import { IMembershipRepository } from '@/core/domain/contracts';

export class RemoveMemberUseCase {
  constructor(private readonly membershipRepository: IMembershipRepository) {}

  async execute(membershipId: string): Promise<void> {
    const membership = await this.membershipRepository.findById(membershipId);

    if (!membership) {
      throw new RemoveMemberError('Membership not found.');
    }

    await this.membershipRepository.softDelete(membershipId);
  }
}

export class RemoveMemberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RemoveMemberError';
  }
}
