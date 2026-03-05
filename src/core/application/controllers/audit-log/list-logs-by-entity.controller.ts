import { ListLogsByEntityUseCase } from '../../use-cases/audit-log';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListLogsByEntityController {
  constructor(private readonly listLogsByEntityUseCase: ListLogsByEntityUseCase) {}

  async handle(entityType: string, entityId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const logs = await this.listLogsByEntityUseCase.execute(entityType, entityId);

      return ok(logs.map((l) => l.toJSON()));
    } catch {
      return serverError();
    }
  }
}
