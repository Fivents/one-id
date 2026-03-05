import { ListEventCheckInsUseCase } from '../../use-cases/check-in';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListEventCheckInsController {
  constructor(private readonly listEventCheckInsUseCase: ListEventCheckInsUseCase) {}

  async handle(eventId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const checkIns = await this.listEventCheckInsUseCase.execute(eventId);

      return ok(checkIns.map((checkIn) => checkIn.toJSON()));
    } catch {
      return serverError();
    }
  }
}
