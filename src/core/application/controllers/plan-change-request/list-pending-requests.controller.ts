import { ListPendingRequestsUseCase } from '../../use-cases/plan-change-request';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListPendingRequestsController {
  constructor(private readonly listPendingRequestsUseCase: ListPendingRequestsUseCase) {}

  async handle(organizationId?: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const requests = await this.listPendingRequestsUseCase.execute(organizationId);

      return ok(requests.map((r) => r.toJSON()));
    } catch {
      return serverError();
    }
  }
}
