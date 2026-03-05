import { ITotemEventSubscriptionRepository } from '@/core/domain/contracts';
import { TotemEventSubscriptionNotFoundError } from '@/core/errors';

export class UnlinkTotemFromEventUseCase {
  constructor(private readonly totemEventSubRepository: ITotemEventSubscriptionRepository) {}

  async execute(subscriptionId: string): Promise<void> {
    const subscription = await this.totemEventSubRepository.findById(subscriptionId);

    if (!subscription) {
      throw new TotemEventSubscriptionNotFoundError(subscriptionId);
    }

    await this.totemEventSubRepository.softDelete(subscriptionId);
  }
}
