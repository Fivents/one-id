import { ITotemEventSubscriptionRepository } from '@/core/domain/contracts';
import type { TotemEventSubscriptionEntity } from '@/core/domain/entities/totem-event-subscription.entity';
import { TotemEventSubscriptionNotFoundError } from '@/core/errors';

export class SetTotemLocationUseCase {
  constructor(private readonly totemEventSubRepository: ITotemEventSubscriptionRepository) {}

  async execute(subscriptionId: string, locationName: string): Promise<TotemEventSubscriptionEntity> {
    const subscription = await this.totemEventSubRepository.findById(subscriptionId);

    if (!subscription) {
      throw new TotemEventSubscriptionNotFoundError(subscriptionId);
    }

    return this.totemEventSubRepository.update(subscriptionId, { locationName });
  }
}
