import { AppError } from '@/core/errors';

import { DeleteClientUserUseCase } from '../../use-cases/admin';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class DeleteClientUserController {
  constructor(private readonly deleteClientUserUseCase: DeleteClientUserUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deleteClientUserUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
