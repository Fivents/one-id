import { IMembershipRepository } from '@/core/domain/contracts';
import type { MembershipEntity } from '@/core/domain/entities';

export class ListMembersUseCase {
  constructor(private readonly membershipRepository: IMembershipRepository) {}

  async execute(organizationId: string): Promise<MembershipEntity[]> {
    return this.membershipRepository.findByOrganization(organizationId);
  }
}
