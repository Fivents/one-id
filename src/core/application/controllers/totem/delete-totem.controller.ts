import { AppError } from '@/core/errors';

import { DeleteTotemUseCase } from '../../use-cases/totem';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class DeleteTotemController {
  constructor(private readonly deleteTotemUseCase: DeleteTotemUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deleteTotemUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
