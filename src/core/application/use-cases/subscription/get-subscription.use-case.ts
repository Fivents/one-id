import { ISubscriptionRepository } from '@/core/domain/contracts';
import type { SubscriptionEntity } from '@/core/domain/entities/subscription.entity';
import { AppError, ErrorCode } from '@/core/errors';

export class GetSubscriptionUseCase {
  constructor(private readonly subscriptionRepository: ISubscriptionRepository) {}

  async execute(organizationId: string): Promise<SubscriptionEntity> {
    const subscription = await this.subscriptionRepository.findByOrganization(organizationId);

    if (!subscription) {
      throw new AppError({
        code: ErrorCode.SUBSCRIPTION_NOT_FOUND,
        message: 'Subscription not found for this organization.',
        httpStatus: 404,
        level: 'warning',
        context: { organizationId },
      });
    }

    return subscription;
  }
}
