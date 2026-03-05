import { IMembershipRepository } from '@/core/domain/contracts';
import type { MembershipEntity } from '@/core/domain/entities';
import { MemberNotFoundError } from '@/core/errors';

export class GetMemberUseCase {
  constructor(private readonly membershipRepository: IMembershipRepository) {}

  async execute(userId: string, organizationId: string): Promise<MembershipEntity> {
    const membership = await this.membershipRepository.findByUserAndOrganization(userId, organizationId);

    if (!membership) {
      throw new MemberNotFoundError();
    }

    return membership;
  }
}
