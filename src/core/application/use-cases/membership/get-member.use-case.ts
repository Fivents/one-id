import { IMembershipRepository } from '@/core/domain/contracts';
import type { MembershipEntity } from '@/core/domain/entities';

export class GetMemberUseCase {
  constructor(private readonly membershipRepository: IMembershipRepository) {}

  async execute(userId: string, organizationId: string): Promise<MembershipEntity> {
    const membership = await this.membershipRepository.findByUserAndOrganization(userId, organizationId);

    if (!membership) {
      throw new GetMemberError('Membership not found.');
    }

    return membership;
  }
}

export class GetMemberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetMemberError';
  }
}
