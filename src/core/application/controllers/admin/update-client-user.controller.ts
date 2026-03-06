import type { UpdateClientUserRequest } from '@/core/communication/requests/admin';
import type { AdminUserResponse } from '@/core/communication/responses/admin';
import { AppError } from '@/core/errors';

import { UpdateClientUserUseCase } from '../../use-cases/admin';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdateClientUserController {
  constructor(private readonly updateClientUserUseCase: UpdateClientUserUseCase) {}

  async handle(id: string, request: UpdateClientUserRequest): Promise<ControllerResponse<AdminUserResponse>> {
    try {
      const result = await this.updateClientUserUseCase.execute(id, request);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
