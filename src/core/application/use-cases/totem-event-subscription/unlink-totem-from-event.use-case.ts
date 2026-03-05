import { ITotemEventSubscriptionRepository } from '@/core/domain/contracts';

export class UnlinkTotemFromEventUseCase {
  constructor(private readonly totemEventSubRepository: ITotemEventSubscriptionRepository) {}

  async execute(subscriptionId: string): Promise<void> {
    const subscription = await this.totemEventSubRepository.findById(subscriptionId);

    if (!subscription) {
      throw new UnlinkTotemFromEventError('Totem-event subscription not found.');
    }

    await this.totemEventSubRepository.softDelete(subscriptionId);
  }
}

export class UnlinkTotemFromEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnlinkTotemFromEventError';
  }
}
