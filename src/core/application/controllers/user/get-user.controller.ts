import { AppError } from '@/core/errors';

import { GetUserUseCase } from '../../use-cases/user';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GetUserController {
  constructor(private readonly getUserUseCase: GetUserUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const user = await this.getUserUseCase.execute(id);

      return ok(user.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
