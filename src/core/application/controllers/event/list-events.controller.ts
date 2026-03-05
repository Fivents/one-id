import { ListEventsUseCase } from '../../use-cases/event';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListEventsController {
  constructor(private readonly listEventsUseCase: ListEventsUseCase) {}

  async handle(organizationId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const events = await this.listEventsUseCase.execute(organizationId);

      return ok(events.map((event) => event.toJSON()));
    } catch {
      return serverError();
    }
  }
}
