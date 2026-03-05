import { AppError } from '@/core/errors';

import { SetupClientPasswordUseCase } from '../../use-cases/auth';
import { type ControllerResponse, ok, serverError, unauthorized } from '../controller-response';

export class SetupPasswordController {
  constructor(private readonly setupPasswordUseCase: SetupClientPasswordUseCase) {}

  async handle(token: string, password: string): Promise<ControllerResponse<{ success: true }>> {
    try {
      await this.setupPasswordUseCase.execute(token, password);

      return ok({ success: true as const });
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      if (error instanceof Error && error.message.includes('JW')) {
        return unauthorized('Invalid or expired setup token.');
      }

      return serverError();
    }
  }
}
