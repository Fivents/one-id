import type { AuthTokenResponse } from '@/core/communication/responses/auth';

import { RefreshSessionError, RefreshSessionUseCase } from '../../use-cases/auth';
import { type ControllerResponse, ok, serverError, unauthorized } from '../controller-response';

export interface RefreshSessionMeta {
  ipAddress: string;
  userAgent: string;
  deviceId: string;
}

export class RefreshSessionController {
  constructor(private readonly refreshSessionUseCase: RefreshSessionUseCase) {}

  async handle(currentToken: string, meta: RefreshSessionMeta): Promise<ControllerResponse<AuthTokenResponse>> {
    try {
      const result = await this.refreshSessionUseCase.execute(currentToken, meta);

      return ok(result);
    } catch (error) {
      if (error instanceof RefreshSessionError) {
        return unauthorized(error.message);
      }

      return serverError();
    }
  }
}
