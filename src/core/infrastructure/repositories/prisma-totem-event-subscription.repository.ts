import type {
  CreateTotemEventSubscriptionData,
  ITotemEventSubscriptionRepository,
  UpdateTotemEventSubscriptionData,
} from '@/core/domain/contracts';
import { TotemEventSubscriptionEntity } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaTotemEventSubscriptionRepository implements ITotemEventSubscriptionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<TotemEventSubscriptionEntity | null> {
    const sub = await this.db.totemEventSubscription.findUnique({
      where: { id },
    });

    if (!sub) return null;

    return TotemEventSubscriptionEntity.create({
      id: sub.id,
      locationName: sub.locationName,
      totemOrganizationSubscriptionId: sub.totemOrganizationSubscriptionId,
      eventId: sub.eventId,
      startsAt: sub.startsAt,
      endsAt: sub.endsAt,
    });
  }

  async findByEvent(eventId: string): Promise<TotemEventSubscriptionEntity[]> {
    const subs = await this.db.totemEventSubscription.findMany({
      where: { eventId },
    });

    return subs.map((sub) =>
      TotemEventSubscriptionEntity.create({
        id: sub.id,
        locationName: sub.locationName,
        totemOrganizationSubscriptionId: sub.totemOrganizationSubscriptionId,
        eventId: sub.eventId,
        startsAt: sub.startsAt,
        endsAt: sub.endsAt,
      }),
    );
  }

  async create(data: CreateTotemEventSubscriptionData): Promise<TotemEventSubscriptionEntity> {
    const sub = await this.db.totemEventSubscription.create({
      data: {
        locationName: data.locationName,
        totemOrganizationSubscriptionId: data.totemOrganizationSubscriptionId,
        eventId: data.eventId,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      },
    });

    return TotemEventSubscriptionEntity.create({
      id: sub.id,
      locationName: sub.locationName,
      totemOrganizationSubscriptionId: sub.totemOrganizationSubscriptionId,
      eventId: sub.eventId,
      startsAt: sub.startsAt,
      endsAt: sub.endsAt,
    });
  }

  async update(id: string, data: UpdateTotemEventSubscriptionData): Promise<TotemEventSubscriptionEntity> {
    const sub = await this.db.totemEventSubscription.update({
      where: { id },
      data: {
        locationName: data.locationName,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      },
    });

    return TotemEventSubscriptionEntity.create({
      id: sub.id,
      locationName: sub.locationName,
      totemOrganizationSubscriptionId: sub.totemOrganizationSubscriptionId,
      eventId: sub.eventId,
      startsAt: sub.startsAt,
      endsAt: sub.endsAt,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.totemEventSubscription.delete({ where: { id } });
  }
}
