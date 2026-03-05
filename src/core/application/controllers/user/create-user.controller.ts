import type { CreateUserRequest } from '@/core/communication/requests/user';

import { CreateUserError, CreateUserUseCase } from '../../use-cases/user';
import { conflict, type ControllerResponse, created, serverError } from '../controller-response';

export class CreateUserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async handle(request: CreateUserRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const user = await this.createUserUseCase.execute(request);

      return created(user.toJSON());
    } catch (error) {
      if (error instanceof CreateUserError) {
        return conflict(error.message);
      }

      return serverError();
    }
  }
}
