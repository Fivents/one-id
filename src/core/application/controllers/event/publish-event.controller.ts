import { PublishEventError, PublishEventUseCase } from '../../use-cases/event';
import { badRequest, type ControllerResponse, ok, serverError } from '../controller-response';

export class PublishEventController {
  constructor(private readonly publishEventUseCase: PublishEventUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const event = await this.publishEventUseCase.execute(id);

      return ok(event.toJSON());
    } catch (error) {
      if (error instanceof PublishEventError) {
        return badRequest(error.message);
      }

      return serverError();
    }
  }
}
