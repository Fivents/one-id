import { ActivateEventError, ActivateEventUseCase } from '../../use-cases/event';
import { badRequest, type ControllerResponse, ok, serverError } from '../controller-response';

export class ActivateEventController {
  constructor(private readonly activateEventUseCase: ActivateEventUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const event = await this.activateEventUseCase.execute(id);

      return ok(event.toJSON());
    } catch (error) {
      if (error instanceof ActivateEventError) {
        return badRequest(error.message);
      }

      return serverError();
    }
  }
}
