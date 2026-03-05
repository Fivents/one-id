import { AppError } from '@/core/errors';

import { RevokeSessionUseCase } from '../../use-cases/auth';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class RevokeSessionController {
  constructor(private readonly revokeSessionUseCase: RevokeSessionUseCase) {}

  async handle(sessionId: string): Promise<ControllerResponse<null>> {
    try {
      await this.revokeSessionUseCase.execute(sessionId);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
