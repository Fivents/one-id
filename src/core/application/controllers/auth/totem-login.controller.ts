import type { TotemAuthResponse } from '@/core/communication/responses/auth';
import { AppError } from '@/core/errors';

import { LoginWithAccessCodeTotemUseCase } from '../../use-cases/auth';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export interface TotemLoginMeta {
  ipAddress: string;
  userAgent: string;
}

export class TotemLoginController {
  constructor(private readonly totemLoginUseCase: LoginWithAccessCodeTotemUseCase) {}

  async handle(accessCode: string, meta: TotemLoginMeta): Promise<ControllerResponse<TotemAuthResponse>> {
    try {
      const result = await this.totemLoginUseCase.execute(accessCode, meta);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
