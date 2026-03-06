import type { RestoreClientUserRequest } from '@/core/communication/requests/admin';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import { AppError } from '@/core/errors';
import { Logger } from '@/core/utils/logger';

import { RestoreClientUserUseCase } from '../../use-cases/admin';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class RestoreClientUserController {
  constructor(private readonly restoreClientUserUseCase: RestoreClientUserUseCase) {}

  async handle(request: RestoreClientUserRequest): Promise<ControllerResponse<{ user: AdminUserResponse }>> {
    try {
      const result = await this.restoreClientUserUseCase.execute(request);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      Logger.error('RestoreClientUserController - Unexpected error', { error }, 'AdminUsers');
      return serverError();
    }
  }
}
