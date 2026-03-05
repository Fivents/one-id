import { IMembershipRepository } from '@/core/domain/contracts';
import type { MembershipEntity } from '@/core/domain/entities';
import type { Role } from '@/core/domain/value-objects';
import { MemberNotFoundError } from '@/core/errors';

export class UpdateMemberRoleUseCase {
  constructor(private readonly membershipRepository: IMembershipRepository) {}

  async execute(membershipId: string, role: Role): Promise<MembershipEntity> {
    const membership = await this.membershipRepository.findById(membershipId);

    if (!membership) {
      throw new MemberNotFoundError(membershipId);
    }

    return this.membershipRepository.updateRole(membershipId, role);
  }
}
