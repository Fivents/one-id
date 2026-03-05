import type { UpdatePrintConfigRequest } from '@/core/communication/requests/print-config';

import { UpdatePrintConfigError, UpdatePrintConfigUseCase } from '../../use-cases/print-config';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class UpdatePrintConfigController {
  constructor(private readonly updatePrintConfigUseCase: UpdatePrintConfigUseCase) {}

  async handle(id: string, request: UpdatePrintConfigRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const config = await this.updatePrintConfigUseCase.execute(id, request);

      return ok(config.toJSON());
    } catch (error) {
      if (error instanceof UpdatePrintConfigError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
