import { AppError } from '@/core/errors';

import { ActivateTotemUseCase } from '../../use-cases/totem';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class ActivateTotemController {
  constructor(private readonly activateTotemUseCase: ActivateTotemUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.activateTotemUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
