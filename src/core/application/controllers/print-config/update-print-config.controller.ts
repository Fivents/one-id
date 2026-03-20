import type { UpdatePrintConfigRequest } from '@/core/communication/requests/print-config';
import { AppError } from '@/core/errors';

import { UpdatePrintConfigUseCase } from '../../use-cases/print-config';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdatePrintConfigController {
  constructor(private readonly updatePrintConfigUseCase: UpdatePrintConfigUseCase) {}

  async handle(id: string, request: UpdatePrintConfigRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      // Convert itemsOrder array to JSON string for the entity if present
      const data = {
        ...request,
        ...(request.itemsOrder !== undefined && { itemsOrder: JSON.stringify(request.itemsOrder) }),
      };
      const config = await this.updatePrintConfigUseCase.execute(id, data as unknown);

      return ok(config.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
