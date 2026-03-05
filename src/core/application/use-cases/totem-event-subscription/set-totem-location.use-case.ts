import { ITotemEventSubscriptionRepository } from '@/core/domain/contracts';
import type { TotemEventSubscriptionEntity } from '@/core/domain/entities/totem-event-subscription.entity';

export class SetTotemLocationUseCase {
  constructor(private readonly totemEventSubRepository: ITotemEventSubscriptionRepository) {}

  async execute(subscriptionId: string, locationName: string): Promise<TotemEventSubscriptionEntity> {
    const subscription = await this.totemEventSubRepository.findById(subscriptionId);

    if (!subscription) {
      throw new SetTotemLocationError('Totem-event subscription not found.');
    }

    return this.totemEventSubRepository.update(subscriptionId, { locationName });
  }
}

export class SetTotemLocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SetTotemLocationError';
  }
}
