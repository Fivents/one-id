import type { CreateClientUserRequest } from '@/core/communication/requests/admin';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import { AppError, UserSoftDeletedError } from '@/core/errors';
import { Logger } from '@/core/utils/logger';

import { CreateClientUserUseCase } from '../../use-cases/admin';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class CreateClientUserController {
  constructor(private readonly createClientUserUseCase: CreateClientUserUseCase) {}

  async handle(request: CreateClientUserRequest): Promise<ControllerResponse<{ user: AdminUserResponse }>> {
    try {
      const result = await this.createClientUserUseCase.execute(request);

      return created(result);
    } catch (error) {
      if (error instanceof UserSoftDeletedError) {
        return {
          statusCode: 409,
          body: {
            error: error.message,
            code: 'USER_SOFT_DELETED',
            softDeletedUser: error.softDeletedUser,
          },
        };
      }

      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      Logger.error('CreateClientUserController - Unexpected error', { error }, 'AdminUsers');
      return serverError();
    }
  }
}
