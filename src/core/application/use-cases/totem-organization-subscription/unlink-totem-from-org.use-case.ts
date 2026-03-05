import { ITotemOrganizationSubscriptionRepository } from '@/core/domain/contracts';

export class UnlinkTotemFromOrgUseCase {
  constructor(private readonly totemOrgSubRepository: ITotemOrganizationSubscriptionRepository) {}

  async execute(subscriptionId: string): Promise<void> {
    const subscription = await this.totemOrgSubRepository.findById(subscriptionId);

    if (!subscription) {
      throw new UnlinkTotemFromOrgError('Totem-organization subscription not found.');
    }

    await this.totemOrgSubRepository.softDelete(subscriptionId);
  }
}

export class UnlinkTotemFromOrgError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnlinkTotemFromOrgError';
  }
}
