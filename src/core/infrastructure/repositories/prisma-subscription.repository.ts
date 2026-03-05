import type { CreateSubscriptionData, ISubscriptionRepository, UpdateSubscriptionData } from '@/core/domain/contracts';
import { SubscriptionEntity } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByOrganization(organizationId: string): Promise<SubscriptionEntity | null> {
    const subscription = await this.db.subscription.findFirst({
      where: { organizationId },
      orderBy: { startedAt: 'desc' },
    });

    if (!subscription) return null;

    return SubscriptionEntity.create({
      id: subscription.id,
      organizationId: subscription.organizationId,
      planId: subscription.planId,
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
      updatedAt: subscription.updatedAt,
    });
  }

  async create(data: CreateSubscriptionData): Promise<SubscriptionEntity> {
    const subscription = await this.db.subscription.create({
      data: {
        organizationId: data.organizationId,
        planId: data.planId,
        startedAt: data.startedAt,
        expiresAt: data.expiresAt,
      },
    });

    return SubscriptionEntity.create({
      id: subscription.id,
      organizationId: subscription.organizationId,
      planId: subscription.planId,
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
      updatedAt: subscription.updatedAt,
    });
  }

  async update(id: string, data: UpdateSubscriptionData): Promise<SubscriptionEntity> {
    const subscription = await this.db.subscription.update({
      where: { id },
      data: {
        planId: data.planId,
        expiresAt: data.expiresAt,
      },
    });

    return SubscriptionEntity.create({
      id: subscription.id,
      organizationId: subscription.organizationId,
      planId: subscription.planId,
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
      updatedAt: subscription.updatedAt,
    });
  }
}
