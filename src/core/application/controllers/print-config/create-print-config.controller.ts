import type { CreatePrintConfigRequest } from '@/core/communication/requests/print-config';

import { CreatePrintConfigUseCase } from '../../use-cases/print-config';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class CreatePrintConfigController {
  constructor(private readonly createPrintConfigUseCase: CreatePrintConfigUseCase) {}

  async handle(request: CreatePrintConfigRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const config = await this.createPrintConfigUseCase.execute(request);

      return created(config.toJSON());
    } catch {
      return serverError();
    }
  }
}
