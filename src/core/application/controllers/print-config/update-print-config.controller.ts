import type { UpdatePrintConfigRequest } from '@/core/communication/requests/print-config';
import { AppError } from '@/core/errors';

import { UpdatePrintConfigUseCase } from '../../use-cases/print-config';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdatePrintConfigController {
  constructor(private readonly updatePrintConfigUseCase: UpdatePrintConfigUseCase) {}

  async handle(id: string, request: UpdatePrintConfigRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const config = await this.updatePrintConfigUseCase.execute(id, request);

      return ok(config.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
