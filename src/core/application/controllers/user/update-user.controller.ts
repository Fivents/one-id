import type { UpdateUserRequest } from '@/core/communication/requests/user';
import { AppError } from '@/core/errors';

import { UpdateUserUseCase } from '../../use-cases/user';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdateUserController {
  constructor(private readonly updateUserUseCase: UpdateUserUseCase) {}

  async handle(id: string, request: UpdateUserRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const user = await this.updateUserUseCase.execute(id, {
        ...request,
        avatarUrl: request.avatarUrl ?? undefined,
      });

      return ok(user.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
