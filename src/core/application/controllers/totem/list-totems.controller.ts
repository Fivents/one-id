import { ListTotemsUseCase } from '../../use-cases/totem';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListTotemsController {
  constructor(private readonly listTotemsUseCase: ListTotemsUseCase) {}

  async handle(): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const totems = await this.listTotemsUseCase.execute();

      return ok(totems.map((totem) => totem.toJSON()));
    } catch {
      return serverError();
    }
  }
}
