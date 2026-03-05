import { ListParticipantCheckInsUseCase } from '../../use-cases/check-in';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListParticipantCheckInsController {
  constructor(private readonly listParticipantCheckInsUseCase: ListParticipantCheckInsUseCase) {}

  async handle(eventParticipantId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const checkIns = await this.listParticipantCheckInsUseCase.execute(eventParticipantId);

      return ok(checkIns.map((checkIn) => checkIn.toJSON()));
    } catch {
      return serverError();
    }
  }
}
