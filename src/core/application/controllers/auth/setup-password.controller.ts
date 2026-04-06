import type { AuthTokenResponse } from '@/core/communication/responses/auth';
import { AppError } from '@/core/errors';

import { SetupClientPasswordUseCase } from '../../use-cases/auth';
import { type ControllerResponse, ok, serverError, unauthorized } from '../controller-response';

export interface SetupPasswordRequestMeta {
  ipAddress: string;
  userAgent: string;
  deviceId: string;
}

export class SetupPasswordController {
  constructor(private readonly setupPasswordUseCase: SetupClientPasswordUseCase) {}

  async handle(
    token: string,
    password: string,
    meta: SetupPasswordRequestMeta,
  ): Promise<ControllerResponse<AuthTokenResponse>> {
    try {
      const result = await this.setupPasswordUseCase.execute(token, password, meta);

      return ok(result);
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
