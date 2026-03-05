import { AppError } from '@/core/errors';

import { DuplicatePrintConfigUseCase } from '../../use-cases/print-config';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class DuplicatePrintConfigController {
  constructor(private readonly duplicatePrintConfigUseCase: DuplicatePrintConfigUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const config = await this.duplicatePrintConfigUseCase.execute(id);

      return created(config.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
