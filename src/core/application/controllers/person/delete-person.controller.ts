import { AppError } from '@/core/errors';

import { DeletePersonUseCase } from '../../use-cases/person';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class DeletePersonController {
  constructor(private readonly deletePersonUseCase: DeletePersonUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deletePersonUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
