import {
  ICheckInRepository,
  IEventParticipantRepository,
  ITotemEventSubscriptionRepository,
} from '@/core/domain/contracts';
import type { CheckInEntity } from '@/core/domain/entities/check-in.entity';
import { AppError, ErrorCode } from '@/core/errors';
import { ParticipantNotFoundError } from '@/core/errors';

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
      throw new AppError({
        code: ErrorCode.CHECKIN_LOW_CONFIDENCE,
        message: 'Confidence score is too low for face recognition check-in.',
        httpStatus: 400,
        level: 'warning',
        context: { confidence: input.confidence, threshold: MIN_CONFIDENCE_THRESHOLD },
      });
    }

    const participant = await this.eventParticipantRepository.findById(input.eventParticipantId);
    if (!participant) {
      throw new ParticipantNotFoundError(input.eventParticipantId);
    }

    const totemEventSub = await this.totemEventSubRepository.findById(input.totemEventSubscriptionId);
    if (!totemEventSub) {
      throw new AppError({
        code: ErrorCode.TOTEM_EVENT_SUBSCRIPTION_NOT_FOUND,
        message: 'Totem-event subscription not found.',
        httpStatus: 404,
        level: 'warning',
        context: { totemEventSubscriptionId: input.totemEventSubscriptionId },
      });
    }

    const existing = await this.checkInRepository.findByParticipantAndLocation(
      input.eventParticipantId,
      input.totemEventSubscriptionId,
    );

    if (existing) {
      throw new AppError({
        code: ErrorCode.CHECKIN_DUPLICATE,
        message: 'Participant already checked in at this location.',
        httpStatus: 409,
        level: 'warning',
        context: { eventParticipantId: input.eventParticipantId },
      });
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
