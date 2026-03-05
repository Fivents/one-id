import {
  ICheckInRepository,
  IEventParticipantRepository,
  ITotemEventSubscriptionRepository,
} from '@/core/domain/contracts';
import type { CheckInEntity } from '@/core/domain/entities/check-in.entity';
import { AppError, ErrorCode, ParticipantNotFoundError } from '@/core/errors';

const MIN_CONFIDENCE_THRESHOLD = 0.7;

export class CheckInService {
  constructor(
    private readonly checkInRepository: ICheckInRepository,
    private readonly eventParticipantRepository: IEventParticipantRepository,
    private readonly totemEventSubRepository: ITotemEventSubscriptionRepository,
  ) {}

  async performCheckIn(input: {
    method: 'FACE_RECOGNITION' | 'QR_CODE' | 'MANUAL';
    eventParticipantId: string;
    totemEventSubscriptionId: string;
    confidence?: number;
  }): Promise<CheckInEntity> {
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

    if (!totemEventSub.isActive()) {
      throw new AppError({
        code: ErrorCode.TOTEM_EVENT_SUBSCRIPTION_INACTIVE,
        message: 'Totem-event subscription is not active.',
        httpStatus: 409,
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

    if (input.method === 'FACE_RECOGNITION') {
      if (input.confidence == null) {
        throw new AppError({
          code: ErrorCode.CHECKIN_CONFIDENCE_REQUIRED,
          message: 'Confidence score is required for face recognition check-in.',
          httpStatus: 400,
          level: 'warning',
        });
      }
      if (input.confidence < MIN_CONFIDENCE_THRESHOLD) {
        throw new AppError({
          code: ErrorCode.CHECKIN_LOW_CONFIDENCE,
          message: 'Confidence score is too low.',
          httpStatus: 400,
          level: 'warning',
          context: { confidence: input.confidence, threshold: MIN_CONFIDENCE_THRESHOLD },
        });
      }
    }

    return this.checkInRepository.create({
      method: input.method,
      confidence: input.method === 'FACE_RECOGNITION' ? input.confidence : null,
      checkedInAt: new Date(),
      eventParticipantId: input.eventParticipantId,
      totemEventSubscriptionId: input.totemEventSubscriptionId,
    });
  }

  async getCheckInStats(eventId: string): Promise<{
    total: number;
    faceRecognition: number;
    qrCode: number;
    manual: number;
  }> {
    const checkIns = await this.checkInRepository.findByEvent(eventId);

    return {
      total: checkIns.length,
      faceRecognition: checkIns.filter((c) => c.isFaceRecognition()).length,
      qrCode: checkIns.filter((c) => c.isQrCode()).length,
      manual: checkIns.filter((c) => c.isManual()).length,
    };
  }
}
