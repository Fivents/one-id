import type { LoginEmailRequest } from '@/core/communication/requests/auth';
import type { AuthTokenResponse } from '@/core/communication/responses/auth';

import { LoginEmailError, LoginWithEmailClientUseCase } from '../../use-cases/auth';
import { type ControllerResponse, ok, serverError, unauthorized } from '../controller-response';

export interface LoginRequestMeta {
  ipAddress: string;
  userAgent: string;
  deviceId: string;
}

export class LoginController {
  constructor(private readonly loginUseCase: LoginWithEmailClientUseCase) {}

  async handle(request: LoginEmailRequest, meta: LoginRequestMeta): Promise<ControllerResponse<AuthTokenResponse>> {
    try {
      const result = await this.loginUseCase.execute(request, meta);

      return ok(result);
    } catch (error) {
      if (error instanceof LoginEmailError) {
        return unauthorized(error.message);
      }

      return serverError();
    }
  }
}
