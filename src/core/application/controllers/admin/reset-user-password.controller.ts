import { AppError } from '@/core/errors';

import { ResetUserPasswordUseCase } from '../../use-cases/admin';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ResetUserPasswordController {
  constructor(private readonly resetUserPasswordUseCase: ResetUserPasswordUseCase) {}

  async handle(userId: string): Promise<ControllerResponse<{ success: true }>> {
    try {
      await this.resetUserPasswordUseCase.execute(userId);

      return ok({ success: true as const });
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
