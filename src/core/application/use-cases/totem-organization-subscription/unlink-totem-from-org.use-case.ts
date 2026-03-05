import { ITotemOrganizationSubscriptionRepository } from '@/core/domain/contracts';
import { TotemOrgSubscriptionNotFoundError } from '@/core/errors';

export class UnlinkTotemFromOrgUseCase {
  constructor(private readonly totemOrgSubRepository: ITotemOrganizationSubscriptionRepository) {}

  async execute(subscriptionId: string): Promise<void> {
    const subscription = await this.totemOrgSubRepository.findById(subscriptionId);

    if (!subscription) {
      throw new TotemOrgSubscriptionNotFoundError(subscriptionId);
    }

    await this.totemOrgSubRepository.softDelete(subscriptionId);
  }
}
