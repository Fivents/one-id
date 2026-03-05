import { DuplicatePrintConfigError, DuplicatePrintConfigUseCase } from '../../use-cases/print-config';
import { type ControllerResponse, created, notFound, serverError } from '../controller-response';

export class DuplicatePrintConfigController {
  constructor(private readonly duplicatePrintConfigUseCase: DuplicatePrintConfigUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const config = await this.duplicatePrintConfigUseCase.execute(id);

      return created(config.toJSON());
    } catch (error) {
      if (error instanceof DuplicatePrintConfigError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
