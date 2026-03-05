import { CreateMembershipData, IMembershipRepository } from '@/core/domain/contracts';
import type { MembershipEntity } from '@/core/domain/entities';
import { MemberAlreadyExistsError } from '@/core/errors';

export class AddMemberUseCase {
  constructor(private readonly membershipRepository: IMembershipRepository) {}

  async execute(data: CreateMembershipData): Promise<MembershipEntity> {
    const existing = await this.membershipRepository.findByUserAndOrganization(data.userId, data.organizationId);

    if (existing) {
      throw new MemberAlreadyExistsError(data.userId, data.organizationId);
    }

    return this.membershipRepository.create(data);
  }
}
