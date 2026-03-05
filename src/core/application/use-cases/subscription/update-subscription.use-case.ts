import { ISubscriptionRepository, UpdateSubscriptionData } from '@/core/domain/contracts';
import type { SubscriptionEntity } from '@/core/domain/entities/subscription.entity';

export class UpdateSubscriptionUseCase {
  constructor(private readonly subscriptionRepository: ISubscriptionRepository) {}

  async execute(id: string, data: UpdateSubscriptionData): Promise<SubscriptionEntity> {
    return this.subscriptionRepository.update(id, data);
  }
}
