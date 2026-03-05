import { INotificationRepository } from '@/core/domain/contracts';
import type { NotificationEntity } from '@/core/domain/entities/notification.entity';

export class ListUserNotificationsUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(userId: string, unreadOnly: boolean = false): Promise<NotificationEntity[]> {
    if (unreadOnly) {
      return this.notificationRepository.findUnreadByUser(userId);
    }

    return this.notificationRepository.findByUser(userId);
  }
}
