import { ListUserSessionsUseCase } from '../../use-cases/auth';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListSessionsController {
  constructor(private readonly listSessionsUseCase: ListUserSessionsUseCase) {}

  async handle(userId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const sessions = await this.listSessionsUseCase.execute(userId);

      return ok(sessions);
    } catch {
      return serverError();
    }
  }
}
