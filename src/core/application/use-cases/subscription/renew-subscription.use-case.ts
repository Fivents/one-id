import { ISubscriptionRepository } from '@/core/domain/contracts';
import type { SubscriptionEntity } from '@/core/domain/entities/subscription.entity';

interface RenewSubscriptionInput {
  organizationId: string;
  newExpiresAt: Date;
}

export class RenewSubscriptionUseCase {
  constructor(private readonly subscriptionRepository: ISubscriptionRepository) {}

  async execute(input: RenewSubscriptionInput): Promise<SubscriptionEntity> {
    const subscription = await this.subscriptionRepository.findByOrganization(input.organizationId);

    if (!subscription) {
      throw new RenewSubscriptionError('Subscription not found.');
    }

    return this.subscriptionRepository.update(subscription.id, {
      expiresAt: input.newExpiresAt,
    });
  }
}

export class RenewSubscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RenewSubscriptionError';
  }
}
