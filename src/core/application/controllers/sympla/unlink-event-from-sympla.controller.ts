import { AppError } from '@/core/errors';

import type { UnlinkEventFromSymplaUseCase } from '../../use-cases/sympla';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

import type { ConnectSymplaActor } from './connect-sympla.controller';

export class UnlinkEventFromSymplaController {
  constructor(private readonly unlinkEventFromSymplaUseCase: UnlinkEventFromSymplaUseCase) {}

  async handle(
    eventId: string,
    organizationId: string,
    actor: ConnectSymplaActor = {},
  ): Promise<ControllerResponse<null>> {
    try {
      await this.unlinkEventFromSymplaUseCase.execute({ eventId, organizationId, userId: actor.userId });

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
