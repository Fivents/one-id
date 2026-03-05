import type { CreateUserRequest } from '@/core/communication/requests/user';
import { AppError } from '@/core/errors';

import { CreateUserUseCase } from '../../use-cases/user';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class CreateUserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async handle(request: CreateUserRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const user = await this.createUserUseCase.execute(request);

      return created(user.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
