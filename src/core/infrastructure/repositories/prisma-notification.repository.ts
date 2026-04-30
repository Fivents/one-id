import type { InputJsonValue } from '@prisma/client/runtime/client';

import type { CreateNotificationData, INotificationRepository } from '@/core/domain/contracts';
import { type NotificationChannel, NotificationEntity, type NotificationType } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUser(userId: string): Promise<NotificationEntity[]> {
    const notifications = await this.db.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((n) =>
      NotificationEntity.create({
        id: n.id,
        channel: n.channel as NotificationChannel,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        data: n.data as Record<string, unknown> | null,
        userId: n.userId,
        createdAt: n.createdAt,
        readAt: n.readAt,
        deletedAt: n.deletedAt,
      }),
    );
  }

  async findUnreadByUser(userId: string): Promise<NotificationEntity[]> {
    const notifications = await this.db.notification.findMany({
      where: { userId, readAt: null, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((n) =>
      NotificationEntity.create({
        id: n.id,
        channel: n.channel as NotificationChannel,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        data: n.data as Record<string, unknown> | null,
        userId: n.userId,
        createdAt: n.createdAt,
        readAt: n.readAt,
        deletedAt: n.deletedAt,
      }),
    );
  }

  async create(data: CreateNotificationData): Promise<NotificationEntity> {
    const notification = await this.db.notification.create({
      data: {
        channel: data.channel,
        type: data.type,
        title: data.title,
        message: data.message,
        data: (data.data as InputJsonValue) ?? undefined,
        userId: data.userId,
      },
    });

    return NotificationEntity.create({
      id: notification.id,
      channel: notification.channel as NotificationChannel,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      data: notification.data as Record<string, unknown> | null,
      userId: notification.userId,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      deletedAt: notification.deletedAt,
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.db.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
