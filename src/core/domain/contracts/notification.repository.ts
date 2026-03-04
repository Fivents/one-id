import type { NotificationChannel, NotificationEntity, NotificationType } from '../entities/notification.entity';

export interface CreateNotificationData {
  channel: NotificationChannel;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  userId: string;
}

export interface INotificationRepository {
  findByUser(userId: string): Promise<NotificationEntity[]>;
  findUnreadByUser(userId: string): Promise<NotificationEntity[]>;
  create(data: CreateNotificationData): Promise<NotificationEntity>;
  markAsRead(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
}
