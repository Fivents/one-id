import { GetEventError, GetEventUseCase } from '../../use-cases/event';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class GetEventController {
  constructor(private readonly getEventUseCase: GetEventUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const event = await this.getEventUseCase.execute(id);

      return ok(event.toJSON());
    } catch (error) {
      if (error instanceof GetEventError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
