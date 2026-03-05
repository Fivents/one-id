import type { CreateCheckInData, ICheckInRepository } from '@/core/domain/contracts';
import { CheckInEntity, type CheckInMethod } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaCheckInRepository implements ICheckInRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByParticipantAndLocation(
    eventParticipantId: string,
    totemEventSubscriptionId: string,
  ): Promise<CheckInEntity | null> {
    const checkIn = await this.db.checkIn.findFirst({
      where: { eventParticipantId, totemEventSubscriptionId },
    });

    if (!checkIn) return null;

    return CheckInEntity.create({
      id: checkIn.id,
      method: checkIn.method as CheckInMethod,
      confidence: checkIn.confidence,
      checkedInAt: checkIn.checkedInAt,
      eventParticipantId: checkIn.eventParticipantId,
      totemEventSubscriptionId: checkIn.totemEventSubscriptionId,
    });
  }

  async create(data: CreateCheckInData): Promise<CheckInEntity> {
    const checkIn = await this.db.checkIn.create({
      data: {
        method: data.method,
        confidence: data.confidence,
        checkedInAt: data.checkedInAt,
        eventParticipantId: data.eventParticipantId,
        totemEventSubscriptionId: data.totemEventSubscriptionId,
      },
    });

    return CheckInEntity.create({
      id: checkIn.id,
      method: checkIn.method as CheckInMethod,
      confidence: checkIn.confidence,
      checkedInAt: checkIn.checkedInAt,
      eventParticipantId: checkIn.eventParticipantId,
      totemEventSubscriptionId: checkIn.totemEventSubscriptionId,
    });
  }
}
