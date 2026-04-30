import { AppError } from '@/core/errors';

import { DeactivateTotemUseCase } from '../../use-cases/totem';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class DeactivateTotemController {
  constructor(private readonly deactivateTotemUseCase: DeactivateTotemUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deactivateTotemUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
