import { RemoveParticipantError, RemoveParticipantUseCase } from '../../use-cases/event-participant';
import { type ControllerResponse, noContent, notFound, serverError } from '../controller-response';

export class RemoveParticipantController {
  constructor(private readonly removeParticipantUseCase: RemoveParticipantUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.removeParticipantUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof RemoveParticipantError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
