import { DeleteEventError, DeleteEventUseCase } from '../../use-cases/event';
import { type ControllerResponse, noContent, notFound, serverError } from '../controller-response';

export class DeleteEventController {
  constructor(private readonly deleteEventUseCase: DeleteEventUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deleteEventUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof DeleteEventError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
