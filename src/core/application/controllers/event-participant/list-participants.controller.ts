import { ListParticipantsUseCase } from '../../use-cases/event-participant';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListParticipantsController {
  constructor(private readonly listParticipantsUseCase: ListParticipantsUseCase) {}

  async handle(eventId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const participants = await this.listParticipantsUseCase.execute(eventId);

      return ok(participants.map((p) => p.toJSON()));
    } catch {
      return serverError();
    }
  }
}
