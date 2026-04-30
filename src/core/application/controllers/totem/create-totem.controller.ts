import type { CreateTotemRequest } from '@/core/communication/requests/totem';
import { AppError } from '@/core/errors';

import { CreateTotemUseCase } from '../../use-cases/totem';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class CreateTotemController {
  constructor(private readonly createTotemUseCase: CreateTotemUseCase) {}

  async handle(request: CreateTotemRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const totem = await this.createTotemUseCase.execute(request);

      return created(totem.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
