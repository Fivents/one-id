import { AppError } from '@/core/errors';

import { GetPrintConfigUseCase } from '../../use-cases/print-config';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GetPrintConfigController {
  constructor(private readonly getPrintConfigUseCase: GetPrintConfigUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const config = await this.getPrintConfigUseCase.execute(id);

      return ok(config.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
