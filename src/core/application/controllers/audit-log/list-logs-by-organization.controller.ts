import { ListLogsByOrganizationUseCase } from '../../use-cases/audit-log';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListLogsByOrganizationController {
  constructor(private readonly listLogsByOrganizationUseCase: ListLogsByOrganizationUseCase) {}

  async handle(organizationId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const logs = await this.listLogsByOrganizationUseCase.execute(organizationId);

      return ok(logs.map((l) => l.toJSON()));
    } catch {
      return serverError();
    }
  }
}
