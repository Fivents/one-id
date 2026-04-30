import { AppError } from '@/core/errors';

import { RenewTotemSessionUseCase } from '../../use-cases/totem-session';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export interface RenewTotemSessionMeta {
  ipAddress: string;
  userAgent: string;
}

export class RenewTotemSessionController {
  constructor(private readonly renewTotemSessionUseCase: RenewTotemSessionUseCase) {}

  async handle(totemId: string, meta: RenewTotemSessionMeta): Promise<ControllerResponse<{ token: string }>> {
    try {
      const result = await this.renewTotemSessionUseCase.execute(totemId, meta);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
