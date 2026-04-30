import { ISubscriptionRepository } from '@/core/domain/contracts';
import type { SubscriptionEntity } from '@/core/domain/entities/subscription.entity';
import { AppError, ErrorCode } from '@/core/errors';

interface RenewSubscriptionInput {
  organizationId: string;
  newExpiresAt: Date;
}

export class RenewSubscriptionUseCase {
  constructor(private readonly subscriptionRepository: ISubscriptionRepository) {}

  async execute(input: RenewSubscriptionInput): Promise<SubscriptionEntity> {
    const subscription = await this.subscriptionRepository.findByOrganization(input.organizationId);

    if (!subscription) {
      throw new AppError({
        code: ErrorCode.SUBSCRIPTION_NOT_FOUND,
        message: 'Subscription not found.',
        httpStatus: 404,
        level: 'warning',
        context: { organizationId: input.organizationId },
      });
    }

    return this.subscriptionRepository.update(subscription.id, {
      expiresAt: input.newExpiresAt,
    });
  }
}
