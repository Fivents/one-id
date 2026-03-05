import { AppError } from '@/core/errors';

import { HeartbeatTotemUseCase } from '../../use-cases/totem-session';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class HeartbeatTotemController {
  constructor(private readonly heartbeatTotemUseCase: HeartbeatTotemUseCase) {}

  async handle(totemId: string): Promise<ControllerResponse<null>> {
    try {
      await this.heartbeatTotemUseCase.execute(totemId);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
