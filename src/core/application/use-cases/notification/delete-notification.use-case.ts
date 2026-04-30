import { INotificationRepository } from '@/core/domain/contracts';

export class DeleteNotificationUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(notificationId: string): Promise<void> {
    await this.notificationRepository.softDelete(notificationId);
  }
}
