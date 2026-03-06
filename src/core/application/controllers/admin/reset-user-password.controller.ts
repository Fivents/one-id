import type { ResetPasswordResponse } from '@/core/communication/responses/admin';
import { AppError } from '@/core/errors';

import { ResetUserPasswordUseCase } from '../../use-cases/admin';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ResetUserPasswordController {
  constructor(private readonly resetUserPasswordUseCase: ResetUserPasswordUseCase) {}

  async handle(userId: string): Promise<ControllerResponse<ResetPasswordResponse>> {
    try {
      const result = await this.resetUserPasswordUseCase.execute(userId);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
