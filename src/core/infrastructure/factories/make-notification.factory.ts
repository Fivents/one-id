import { containerService } from '@/core/application/services';
import { CreateNotificationUseCase } from '@/core/application/use-cases/notification/create-notification.use-case';
import { DeleteNotificationUseCase } from '@/core/application/use-cases/notification/delete-notification.use-case';
import { ListUserNotificationsUseCase } from '@/core/application/use-cases/notification/list-user-notifications.use-case';
import { MarkAllNotificationsAsReadUseCase } from '@/core/application/use-cases/notification/mark-all-as-read.use-case';
import { MarkNotificationAsReadUseCase } from '@/core/application/use-cases/notification/mark-as-read.use-case';

export function makeCreateNotificationUseCase(): CreateNotificationUseCase {
  return new CreateNotificationUseCase(containerService.getNotificationRepository());
}

export function makeListUserNotificationsUseCase(): ListUserNotificationsUseCase {
  return new ListUserNotificationsUseCase(containerService.getNotificationRepository());
}

export function makeMarkNotificationAsReadUseCase(): MarkNotificationAsReadUseCase {
  return new MarkNotificationAsReadUseCase(containerService.getNotificationRepository());
}

export function makeDeleteNotificationUseCase(): DeleteNotificationUseCase {
  return new DeleteNotificationUseCase(containerService.getNotificationRepository());
}

export function makeMarkAllNotificationsAsReadUseCase(): MarkAllNotificationsAsReadUseCase {
  return new MarkAllNotificationsAsReadUseCase(containerService.getNotificationRepository());
}
