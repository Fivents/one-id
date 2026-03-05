import { ISubscriptionRepository } from '@/core/domain/contracts';
import type { SubscriptionEntity } from '@/core/domain/entities/subscription.entity';

export class GetSubscriptionUseCase {
  constructor(private readonly subscriptionRepository: ISubscriptionRepository) {}

  async execute(organizationId: string): Promise<SubscriptionEntity> {
    const subscription = await this.subscriptionRepository.findByOrganization(organizationId);

    if (!subscription) {
      throw new GetSubscriptionError('Subscription not found for this organization.');
    }

    return subscription;
  }
}

export class GetSubscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetSubscriptionError';
  }
}
