import { ICheckInRepository } from '@/core/domain/contracts';

export class CheckParticipantCheckInUseCase {
  constructor(private readonly checkInRepository: ICheckInRepository) {}

  async execute(
    eventParticipantId: string,
    totemEventSubscriptionId: string,
  ): Promise<{ checkedIn: boolean; checkInId?: string }> {
    const existing = await this.checkInRepository.findByParticipantAndLocation(
      eventParticipantId,
      totemEventSubscriptionId,
    );

    if (existing) {
      return { checkedIn: true, checkInId: existing.id };
    }

    return { checkedIn: false };
  }
}
