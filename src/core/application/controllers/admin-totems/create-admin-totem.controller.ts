import type { CreateAdminTotemRequest } from '@/core/communication/requests/admin-totems';
import { AppError } from '@/core/errors';

import { CreateAdminTotemUseCase } from '../../use-cases/admin-totems';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class CreateAdminTotemController {
  constructor(private readonly createAdminTotemUseCase: CreateAdminTotemUseCase) {}

  async handle(request: CreateAdminTotemRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const totem = await this.createAdminTotemUseCase.execute(request);

      return created(totem.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
