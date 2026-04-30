import { INotificationRepository } from '@/core/domain/contracts';

export class MarkAllNotificationsAsReadUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(userId: string): Promise<void> {
    const unread = await this.notificationRepository.findUnreadByUser(userId);

    await Promise.all(unread.map((n) => this.notificationRepository.markAsRead(n.id)));
  }
}
