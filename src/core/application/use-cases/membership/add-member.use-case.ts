import { CreateMembershipData, IMembershipRepository } from '@/core/domain/contracts';
import type { MembershipEntity } from '@/core/domain/entities';

export class AddMemberUseCase {
  constructor(private readonly membershipRepository: IMembershipRepository) {}

  async execute(data: CreateMembershipData): Promise<MembershipEntity> {
    const existing = await this.membershipRepository.findByUserAndOrganization(data.userId, data.organizationId);

    if (existing) {
      throw new AddMemberError('User is already a member of this organization.');
    }

    return this.membershipRepository.create(data);
  }
}

export class AddMemberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AddMemberError';
  }
}
