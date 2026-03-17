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
        totemEventSubscriptionId: data.totemEventSubscriptionId ?? null,
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

  async findByEvent(eventId: string): Promise<CheckInEntity[]> {
    const checkIns = await this.db.checkIn.findMany({
      where: {
        eventParticipant: { eventId },
      },
      orderBy: { checkedInAt: 'desc' },
    });

    return checkIns.map((c) =>
      CheckInEntity.create({
        id: c.id,
        method: c.method as CheckInMethod,
        confidence: c.confidence,
        checkedInAt: c.checkedInAt,
        eventParticipantId: c.eventParticipantId,
        totemEventSubscriptionId: c.totemEventSubscriptionId,
      }),
    );
  }

  async findByParticipant(eventParticipantId: string): Promise<CheckInEntity[]> {
    const checkIns = await this.db.checkIn.findMany({
      where: { eventParticipantId },
      orderBy: { checkedInAt: 'desc' },
    });

    return checkIns.map((c) =>
      CheckInEntity.create({
        id: c.id,
        method: c.method as CheckInMethod,
        confidence: c.confidence,
        checkedInAt: c.checkedInAt,
        eventParticipantId: c.eventParticipantId,
        totemEventSubscriptionId: c.totemEventSubscriptionId,
      }),
    );
  }
}
