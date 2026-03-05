import { ITotemOrganizationSubscriptionRepository } from '@/core/domain/contracts';
import type { TotemOrganizationSubscriptionEntity } from '@/core/domain/entities/totem-organization-subscription.entity';

export class ListOrgTotemsUseCase {
  constructor(private readonly totemOrgSubRepository: ITotemOrganizationSubscriptionRepository) {}

  async execute(organizationId: string): Promise<TotemOrganizationSubscriptionEntity[]> {
    return this.totemOrgSubRepository.findByOrganization(organizationId);
  }
}
