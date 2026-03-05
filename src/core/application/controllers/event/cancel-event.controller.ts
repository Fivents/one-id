import { CancelEventError, CancelEventUseCase } from '../../use-cases/event';
import { badRequest, type ControllerResponse, ok, serverError } from '../controller-response';

export class CancelEventController {
  constructor(private readonly cancelEventUseCase: CancelEventUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const event = await this.cancelEventUseCase.execute(id);

      return ok(event.toJSON());
    } catch (error) {
      if (error instanceof CancelEventError) {
        return badRequest(error.message);
      }

      return serverError();
    }
  }
}
