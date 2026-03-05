import { AppError } from '@/core/errors';

import { ValidateTotemSessionUseCase } from '../../use-cases/totem-session';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ValidateTotemSessionController {
  constructor(private readonly validateTotemSessionUseCase: ValidateTotemSessionUseCase) {}

  async handle(token: string): Promise<ControllerResponse<{ totemId: string; sessionId: string }>> {
    try {
      const result = await this.validateTotemSessionUseCase.execute(token);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
