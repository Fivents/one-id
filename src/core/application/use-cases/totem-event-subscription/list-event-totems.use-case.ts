import { ITotemEventSubscriptionRepository } from '@/core/domain/contracts';
import type { TotemEventSubscriptionEntity } from '@/core/domain/entities/totem-event-subscription.entity';

export class ListEventTotemsUseCase {
  constructor(private readonly totemEventSubRepository: ITotemEventSubscriptionRepository) {}

  async execute(eventId: string): Promise<TotemEventSubscriptionEntity[]> {
    return this.totemEventSubRepository.findByEvent(eventId);
  }
}
