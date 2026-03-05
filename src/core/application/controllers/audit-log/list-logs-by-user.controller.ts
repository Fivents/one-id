import { ListLogsByUserUseCase } from '../../use-cases/audit-log';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListLogsByUserController {
  constructor(private readonly listLogsByUserUseCase: ListLogsByUserUseCase) {}

  async handle(userId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const logs = await this.listLogsByUserUseCase.execute(userId);

      return ok(logs.map((l) => l.toJSON()));
    } catch {
      return serverError();
    }
  }
}
