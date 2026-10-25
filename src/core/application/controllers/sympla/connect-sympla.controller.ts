import type { ConnectSymplaRequest } from '@/core/communication/requests/sympla';
import { AppError } from '@/core/errors';

import type { ConnectSymplaUseCase } from '../../use-cases/sympla';
import { type ControllerResponse, created, serverError } from '../controller-response';

export interface ConnectSymplaActor {
  userId?: string | null;
  sessionId?: string | null;
}

export class ConnectSymplaController {
  constructor(private readonly connectSymplaUseCase: ConnectSymplaUseCase) {}

  async handle(
    organizationId: string,
    request: ConnectSymplaRequest,
    actor: ConnectSymplaActor = {},
  ): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const connection = await this.connectSymplaUseCase.execute({
        organizationId,
        token: request.token,
        userId: actor.userId,
        sessionId: actor.sessionId,
      });

      // toJSON() omits the token by construction — see SymplaConnectionEntity.
      return created(connection.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
