import type { AuthTokenResponse } from '@/core/communication/responses/auth';

import { GoogleAdminLoginError, LoginWithGoogleAdminUseCase } from '../../use-cases/auth';
import { type ControllerResponse, forbidden, ok, serverError, unauthorized } from '../controller-response';

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
      if (error instanceof GoogleAdminLoginError) {
        return forbidden(error.message);
      }

      if (error instanceof Error && error.name === 'AdminDomainError') {
        return unauthorized(error.message);
      }

      return serverError();
    }
  }
}
