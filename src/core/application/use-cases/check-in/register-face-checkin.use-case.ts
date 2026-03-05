import {
  ICheckInRepository,
  IEventParticipantRepository,
  ITotemEventSubscriptionRepository,
} from '@/core/domain/contracts';
import type { CheckInEntity } from '@/core/domain/entities/check-in.entity';

interface RegisterFaceCheckInInput {
  eventParticipantId: string;
  totemEventSubscriptionId: string;
  confidence: number;
}

const MIN_CONFIDENCE_THRESHOLD = 0.7;

export class RegisterFaceCheckInUseCase {
  constructor(
    private readonly checkInRepository: ICheckInRepository,
    private readonly eventParticipantRepository: IEventParticipantRepository,
    private readonly totemEventSubRepository: ITotemEventSubscriptionRepository,
  ) {}

  async execute(input: RegisterFaceCheckInInput): Promise<CheckInEntity> {
    if (input.confidence < MIN_CONFIDENCE_THRESHOLD) {
      throw new RegisterFaceCheckInError('Confidence score is too low for face recognition check-in.');
    }

    const participant = await this.eventParticipantRepository.findById(input.eventParticipantId);
    if (!participant) {
      throw new RegisterFaceCheckInError('Participant not found.');
    }

    const totemEventSub = await this.totemEventSubRepository.findById(input.totemEventSubscriptionId);
    if (!totemEventSub) {
      throw new RegisterFaceCheckInError('Totem-event subscription not found.');
    }

    const existing = await this.checkInRepository.findByParticipantAndLocation(
      input.eventParticipantId,
      input.totemEventSubscriptionId,
    );

    if (existing) {
      throw new RegisterFaceCheckInError('Participant already checked in at this location.');
    }

    return this.checkInRepository.create({
      method: 'FACE_RECOGNITION',
      confidence: input.confidence,
      checkedInAt: new Date(),
      eventParticipantId: input.eventParticipantId,
      totemEventSubscriptionId: input.totemEventSubscriptionId,
    });
  }
}

export class RegisterFaceCheckInError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegisterFaceCheckInError';
  }
}
