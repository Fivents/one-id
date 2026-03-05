import type {
  CreateTotemOrganizationSubscriptionData,
  ITotemOrganizationSubscriptionRepository,
} from '@/core/domain/contracts';
import { TotemOrganizationSubscriptionEntity } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaTotemOrganizationSubscriptionRepository implements ITotemOrganizationSubscriptionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<TotemOrganizationSubscriptionEntity | null> {
    const sub = await this.db.totemOrganizationSubscription.findUnique({
      where: { id },
    });

    if (!sub) return null;

    return TotemOrganizationSubscriptionEntity.create({
      id: sub.id,
      totemId: sub.totemId,
      organizationId: sub.organizationId,
      startsAt: sub.startsAt,
      endsAt: sub.endsAt,
    });
  }

  async findByOrganization(organizationId: string): Promise<TotemOrganizationSubscriptionEntity[]> {
    const subs = await this.db.totemOrganizationSubscription.findMany({
      where: { organizationId },
    });

    return subs.map((sub) =>
      TotemOrganizationSubscriptionEntity.create({
        id: sub.id,
        totemId: sub.totemId,
        organizationId: sub.organizationId,
        startsAt: sub.startsAt,
        endsAt: sub.endsAt,
      }),
    );
  }

  async findActiveByTotemAndOrganization(
    totemId: string,
    organizationId: string,
  ): Promise<TotemOrganizationSubscriptionEntity | null> {
    const now = new Date();

    const sub = await this.db.totemOrganizationSubscription.findFirst({
      where: {
        totemId,
        organizationId,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    });

    if (!sub) return null;

    return TotemOrganizationSubscriptionEntity.create({
      id: sub.id,
      totemId: sub.totemId,
      organizationId: sub.organizationId,
      startsAt: sub.startsAt,
      endsAt: sub.endsAt,
    });
  }

  async create(data: CreateTotemOrganizationSubscriptionData): Promise<TotemOrganizationSubscriptionEntity> {
    const sub = await this.db.totemOrganizationSubscription.create({
      data: {
        totemId: data.totemId,
        organizationId: data.organizationId,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      },
    });

    return TotemOrganizationSubscriptionEntity.create({
      id: sub.id,
      totemId: sub.totemId,
      organizationId: sub.organizationId,
      startsAt: sub.startsAt,
      endsAt: sub.endsAt,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.totemOrganizationSubscription.delete({ where: { id } });
  }
}
