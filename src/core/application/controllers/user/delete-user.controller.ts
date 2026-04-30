import { AppError } from '@/core/errors';

import { DeleteUserUseCase } from '../../use-cases/user';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class DeleteUserController {
  constructor(private readonly deleteUserUseCase: DeleteUserUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deleteUserUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
