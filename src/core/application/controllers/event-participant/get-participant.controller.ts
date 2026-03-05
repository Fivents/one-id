import { GetParticipantError, GetParticipantUseCase } from '../../use-cases/event-participant';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class GetParticipantController {
  constructor(private readonly getParticipantUseCase: GetParticipantUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const participant = await this.getParticipantUseCase.execute(id);

      return ok(participant.toJSON());
    } catch (error) {
      if (error instanceof GetParticipantError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
