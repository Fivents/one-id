import { IMembershipRepository } from '@/core/domain/contracts';
import type { MembershipEntity } from '@/core/domain/entities';
import type { Role } from '@/core/domain/value-objects';

export class UpdateMemberRoleUseCase {
  constructor(private readonly membershipRepository: IMembershipRepository) {}

  async execute(membershipId: string, role: Role): Promise<MembershipEntity> {
    const membership = await this.membershipRepository.findById(membershipId);

    if (!membership) {
      throw new UpdateMemberRoleError('Membership not found.');
    }

    return this.membershipRepository.updateRole(membershipId, role);
  }
}

export class UpdateMemberRoleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdateMemberRoleError';
  }
}
