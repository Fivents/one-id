import {
  ICheckInRepository,
  IEventParticipantRepository,
  ITotemEventSubscriptionRepository,
} from '@/core/domain/contracts';
import type { CheckInEntity } from '@/core/domain/entities/check-in.entity';

interface RegisterQrCheckInInput {
  eventParticipantId: string;
  totemEventSubscriptionId: string;
}

export class RegisterQrCheckInUseCase {
  constructor(
    private readonly checkInRepository: ICheckInRepository,
    private readonly eventParticipantRepository: IEventParticipantRepository,
    private readonly totemEventSubRepository: ITotemEventSubscriptionRepository,
  ) {}

  async execute(input: RegisterQrCheckInInput): Promise<CheckInEntity> {
    const participant = await this.eventParticipantRepository.findById(input.eventParticipantId);
    if (!participant) {
      throw new RegisterQrCheckInError('Participant not found.');
    }

    const totemEventSub = await this.totemEventSubRepository.findById(input.totemEventSubscriptionId);
    if (!totemEventSub) {
      throw new RegisterQrCheckInError('Totem-event subscription not found.');
    }

    const existing = await this.checkInRepository.findByParticipantAndLocation(
      input.eventParticipantId,
      input.totemEventSubscriptionId,
    );

    if (existing) {
      throw new RegisterQrCheckInError('Participant already checked in at this location.');
    }

    return this.checkInRepository.create({
      method: 'QR_CODE',
      checkedInAt: new Date(),
      eventParticipantId: input.eventParticipantId,
      totemEventSubscriptionId: input.totemEventSubscriptionId,
    });
  }
}

export class RegisterQrCheckInError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegisterQrCheckInError';
  }
}
