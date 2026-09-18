import { AppError } from '@/core/errors';

import type { DisconnectSymplaUseCase } from '../../use-cases/sympla';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

import type { ConnectSymplaActor } from './connect-sympla.controller';

export class DisconnectSymplaController {
  constructor(private readonly disconnectSymplaUseCase: DisconnectSymplaUseCase) {}

  async handle(organizationId: string, actor: ConnectSymplaActor = {}): Promise<ControllerResponse<null>> {
    try {
      await this.disconnectSymplaUseCase.execute({
        organizationId,
        userId: actor.userId,
        sessionId: actor.sessionId,
      });

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
