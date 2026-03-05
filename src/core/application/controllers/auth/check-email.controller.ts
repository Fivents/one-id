import type { CheckEmailResponse } from '@/core/communication/responses/auth';
import { AppError } from '@/core/errors';

import { CheckEmailClientUseCase } from '../../use-cases/auth';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class CheckEmailController {
  constructor(private readonly checkEmailUseCase: CheckEmailClientUseCase) {}

  async handle(email: string): Promise<ControllerResponse<CheckEmailResponse>> {
    try {
      const result = await this.checkEmailUseCase.execute(email);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
