import type { AuthTokenResponse } from '@/core/communication/responses/auth';
import { AppError } from '@/core/errors';

import { LoginWithGoogleAdminUseCase } from '../../use-cases/auth';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export interface GoogleLoginMeta {
  ipAddress: string;
  userAgent: string;
  deviceId: string;
}

export class GoogleLoginController {
  constructor(private readonly googleLoginUseCase: LoginWithGoogleAdminUseCase) {}

  async handle(code: string, meta: GoogleLoginMeta): Promise<ControllerResponse<AuthTokenResponse>> {
    try {
      const result = await this.googleLoginUseCase.execute(code, meta);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
