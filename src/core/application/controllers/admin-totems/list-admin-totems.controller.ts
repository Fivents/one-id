import { ListAdminTotemsUseCase } from '../../use-cases/admin-totems';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListAdminTotemsController {
  constructor(private readonly listAdminTotemsUseCase: ListAdminTotemsUseCase) {}

  async handle(): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const totems = await this.listAdminTotemsUseCase.execute();

      return ok(totems.map((t) => t.toJSON()));
    } catch {
      return serverError();
    }
  }
}
