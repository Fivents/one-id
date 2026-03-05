import { CreateNotificationData, INotificationRepository } from '@/core/domain/contracts';
import type { NotificationEntity } from '@/core/domain/entities/notification.entity';

export class CreateNotificationUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(data: CreateNotificationData): Promise<NotificationEntity> {
    return this.notificationRepository.create(data);
  }
}
