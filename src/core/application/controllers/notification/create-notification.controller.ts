import type { CreateNotificationRequest } from '@/core/communication/requests/notification';

import { CreateNotificationUseCase } from '../../use-cases/notification';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class CreateNotificationController {
  constructor(private readonly createNotificationUseCase: CreateNotificationUseCase) {}

  async handle(request: CreateNotificationRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const notification = await this.createNotificationUseCase.execute(request);

      return created(notification.toJSON());
    } catch {
      return serverError();
    }
  }
}
