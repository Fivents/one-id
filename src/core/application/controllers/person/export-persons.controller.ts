import { ExportPersonsUseCase } from '../../use-cases/person';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ExportPersonsController {
  constructor(private readonly exportPersonsUseCase: ExportPersonsUseCase) {}

  async handle(organizationId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const result = await this.exportPersonsUseCase.execute(organizationId);

      return ok(result);
    } catch {
      return serverError();
    }
  }
}
