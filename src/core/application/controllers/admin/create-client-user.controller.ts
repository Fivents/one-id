import type { CreateClientUserRequest } from '@/core/communication/requests/admin';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import { AppError } from '@/core/errors';

import { CreateClientUserUseCase } from '../../use-cases/admin';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class CreateClientUserController {
  constructor(private readonly createClientUserUseCase: CreateClientUserUseCase) {}

  async handle(
    request: CreateClientUserRequest,
  ): Promise<ControllerResponse<{ user: AdminUserResponse; temporaryPassword: string }>> {
    try {
      const result = await this.createClientUserUseCase.execute(request);

      return created(result);
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
