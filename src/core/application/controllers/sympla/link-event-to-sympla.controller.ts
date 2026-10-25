import type { LinkEventToSymplaRequest } from '@/core/communication/requests/sympla';
import { AppError } from '@/core/errors';

import type { LinkEventToSymplaUseCase } from '../../use-cases/sympla';
import { type ControllerResponse, created, serverError } from '../controller-response';

import type { ConnectSymplaActor } from './connect-sympla.controller';

export class LinkEventToSymplaController {
  constructor(private readonly linkEventToSymplaUseCase: LinkEventToSymplaUseCase) {}

  async handle(
    eventId: string,
    organizationId: string,
    request: LinkEventToSymplaRequest,
    actor: ConnectSymplaActor = {},
  ): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const link = await this.linkEventToSymplaUseCase.execute({
        eventId,
        organizationId,
        symplaEventIdHash: request.symplaEventIdHash,
        userId: actor.userId,
      });

      return created(link.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
