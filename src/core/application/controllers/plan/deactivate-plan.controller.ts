import { AppError } from '@/core/errors';

import { DeactivatePlanUseCase } from '../../use-cases/plan';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class DeactivatePlanController {
  constructor(private readonly deactivatePlanUseCase: DeactivatePlanUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deactivatePlanUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
