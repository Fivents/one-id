import type { AuthTokenResponse } from '@/core/communication/responses/auth';

import { LoginWithTokenUseCase, TokenLoginError } from '../../use-cases/auth';
import { type ControllerResponse, ok, serverError, unauthorized } from '../controller-response';

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
      if (error instanceof TokenLoginError) {
        return unauthorized(error.message);
      }

      return serverError();
    }
  }
}
