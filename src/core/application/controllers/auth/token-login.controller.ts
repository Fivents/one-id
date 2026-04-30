import type { AuthTokenResponse } from '@/core/communication/responses/auth';
import { AppError } from '@/core/errors';

import { LoginWithTokenUseCase } from '../../use-cases/auth';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export interface TokenLoginMeta {
  ipAddress: string;
  userAgent: string;
  deviceId: string;
}

export class TokenLoginController {
  constructor(private readonly tokenLoginUseCase: LoginWithTokenUseCase) {}

  async handle(token: string, meta: TokenLoginMeta): Promise<ControllerResponse<AuthTokenResponse>> {
    try {
      const result = await this.tokenLoginUseCase.execute(token, meta);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
