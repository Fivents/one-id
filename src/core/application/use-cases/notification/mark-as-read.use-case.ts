import { INotificationRepository } from '@/core/domain/contracts';

export class MarkNotificationAsReadUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(notificationId: string): Promise<void> {
    await this.notificationRepository.markAsRead(notificationId);
  }
}
