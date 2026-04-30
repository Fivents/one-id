import type { UpdateTotemRequest } from '@/core/communication/requests/totem';
import { AppError } from '@/core/errors';

import { UpdateTotemUseCase } from '../../use-cases/totem';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdateTotemController {
  constructor(private readonly updateTotemUseCase: UpdateTotemUseCase) {}

  async handle(id: string, request: UpdateTotemRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const totem = await this.updateTotemUseCase.execute(id, request);

      return ok(totem.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
