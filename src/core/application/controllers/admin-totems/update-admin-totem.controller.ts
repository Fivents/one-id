import type { UpdateAdminTotemRequest } from '@/core/communication/requests/admin-totems';
import { AppError } from '@/core/errors';

import { UpdateAdminTotemUseCase } from '../../use-cases/admin-totems';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdateAdminTotemController {
  constructor(private readonly updateAdminTotemUseCase: UpdateAdminTotemUseCase) {}

  async handle(id: string, request: UpdateAdminTotemRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const totem = await this.updateAdminTotemUseCase.execute(id, request);

      return ok(totem.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
