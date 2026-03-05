import { ListEventTotemsUseCase } from '../../use-cases/totem-event-subscription';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListEventTotemsController {
  constructor(private readonly listEventTotemsUseCase: ListEventTotemsUseCase) {}

  async handle(eventId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const subscriptions = await this.listEventTotemsUseCase.execute(eventId);

      return ok(subscriptions.map((s) => s.toJSON()));
    } catch {
      return serverError();
    }
  }
}
