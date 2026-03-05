import { MarkNotificationAsReadUseCase } from '../../use-cases/notification';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class MarkNotificationAsReadController {
  constructor(private readonly markAsReadUseCase: MarkNotificationAsReadUseCase) {}

  async handle(notificationId: string): Promise<ControllerResponse<null>> {
    try {
      await this.markAsReadUseCase.execute(notificationId);

      return noContent();
    } catch {
      return serverError();
    }
  }
}
