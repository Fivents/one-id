import { MarkAllNotificationsAsReadUseCase } from '../../use-cases/notification';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class MarkAllNotificationsAsReadController {
  constructor(private readonly markAllAsReadUseCase: MarkAllNotificationsAsReadUseCase) {}

  async handle(userId: string): Promise<ControllerResponse<null>> {
    try {
      await this.markAllAsReadUseCase.execute(userId);

      return noContent();
    } catch {
      return serverError();
    }
  }
}
