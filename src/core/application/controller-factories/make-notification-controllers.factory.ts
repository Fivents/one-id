import {
  makeCreateNotificationUseCase,
  makeDeleteNotificationUseCase,
  makeListUserNotificationsUseCase,
  makeMarkAllNotificationsAsReadUseCase,
  makeMarkNotificationAsReadUseCase,
} from '@/core/infrastructure/factories';

import {
  CreateNotificationController,
  DeleteNotificationController,
  ListNotificationsController,
  MarkAllNotificationsAsReadController,
  MarkNotificationAsReadController,
} from '../controllers/notification';

export function makeCreateNotificationController(): CreateNotificationController {
  return new CreateNotificationController(makeCreateNotificationUseCase());
}

export function makeListNotificationsController(): ListNotificationsController {
  return new ListNotificationsController(makeListUserNotificationsUseCase());
}

export function makeMarkNotificationAsReadController(): MarkNotificationAsReadController {
  return new MarkNotificationAsReadController(makeMarkNotificationAsReadUseCase());
}

export function makeMarkAllNotificationsAsReadController(): MarkAllNotificationsAsReadController {
  return new MarkAllNotificationsAsReadController(makeMarkAllNotificationsAsReadUseCase());
}

export function makeDeleteNotificationController(): DeleteNotificationController {
  return new DeleteNotificationController(makeDeleteNotificationUseCase());
}
