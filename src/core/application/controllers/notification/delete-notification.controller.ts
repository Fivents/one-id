import { DeleteNotificationUseCase } from '../../use-cases/notification';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class DeleteNotificationController {
  constructor(private readonly deleteNotificationUseCase: DeleteNotificationUseCase) {}

  async handle(notificationId: string): Promise<ControllerResponse<null>> {
    try {
      await this.deleteNotificationUseCase.execute(notificationId);

      return noContent();
    } catch {
      return serverError();
    }
  }
}
