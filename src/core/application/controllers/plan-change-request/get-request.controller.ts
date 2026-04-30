import { AppError } from '@/core/errors';

import { GetRequestUseCase } from '../../use-cases/plan-change-request';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GetRequestController {
  constructor(private readonly getRequestUseCase: GetRequestUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const request = await this.getRequestUseCase.execute(id);

      return ok(request.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
