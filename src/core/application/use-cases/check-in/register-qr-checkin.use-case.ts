import {
  ICheckInRepository,
  IEventParticipantRepository,
  ITotemEventSubscriptionRepository,
} from '@/core/domain/contracts';
import type { CheckInEntity } from '@/core/domain/entities/check-in.entity';
import { AppError, ErrorCode, ParticipantNotFoundError } from '@/core/errors';

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
      method: 'QR_CODE',
      checkedInAt: new Date(),
      eventParticipantId: input.eventParticipantId,
      totemEventSubscriptionId: input.totemEventSubscriptionId,
    });
  }
}
