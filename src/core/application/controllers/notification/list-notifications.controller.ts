import { ListUserNotificationsUseCase } from '../../use-cases/notification';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListNotificationsController {
  constructor(private readonly listNotificationsUseCase: ListUserNotificationsUseCase) {}

  async handle(userId: string, unreadOnly = false): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const notifications = await this.listNotificationsUseCase.execute(userId, unreadOnly);

      return ok(notifications.map((n) => n.toJSON()));
    } catch {
      return serverError();
    }
  }
}
