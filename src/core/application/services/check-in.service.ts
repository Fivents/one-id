import {
  ICheckInRepository,
  IEventParticipantRepository,
  ITotemEventSubscriptionRepository,
} from '@/core/domain/contracts';
import type { CheckInEntity } from '@/core/domain/entities/check-in.entity';

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
      throw new CheckInServiceError('Participant not found.');
    }

    const totemEventSub = await this.totemEventSubRepository.findById(input.totemEventSubscriptionId);
    if (!totemEventSub) {
      throw new CheckInServiceError('Totem-event subscription not found.');
    }

    if (!totemEventSub.isActive()) {
      throw new CheckInServiceError('Totem-event subscription is not active.');
    }

    const existing = await this.checkInRepository.findByParticipantAndLocation(
      input.eventParticipantId,
      input.totemEventSubscriptionId,
    );

    if (existing) {
      throw new CheckInServiceError('Participant already checked in at this location.');
    }

    if (input.method === 'FACE_RECOGNITION') {
      if (input.confidence == null) {
        throw new CheckInServiceError('Confidence score is required for face recognition check-in.');
      }
      if (input.confidence < MIN_CONFIDENCE_THRESHOLD) {
        throw new CheckInServiceError('Confidence score is too low.');
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

export class CheckInServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckInServiceError';
  }
}
