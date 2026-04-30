import { ListDeletedTotemsUseCase } from '../../use-cases/admin-totems';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListDeletedTotemsController {
  constructor(private readonly listDeletedTotemsUseCase: ListDeletedTotemsUseCase) {}

  async handle(): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const totems = await this.listDeletedTotemsUseCase.execute();

      return ok(totems.map((t) => t.toJSON()));
    } catch {
      return serverError();
    }
  }
}
