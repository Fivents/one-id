import { ITotemOrganizationSubscriptionRepository } from '@/core/domain/contracts';

export class CheckTotemAvailabilityUseCase {
  constructor(private readonly totemOrgSubRepository: ITotemOrganizationSubscriptionRepository) {}

  async execute(
    totemId: string,
    organizationId: string,
  ): Promise<{ available: boolean; activeSubscriptionId?: string }> {
    const existing = await this.totemOrgSubRepository.findActiveByTotemAndOrganization(totemId, organizationId);

    if (existing) {
      return { available: false, activeSubscriptionId: existing.id };
    }

    return { available: true };
  }
}
