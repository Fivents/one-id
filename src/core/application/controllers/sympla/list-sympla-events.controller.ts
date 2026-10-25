import { AppError } from '@/core/errors';

import type { ListSymplaEventsUseCase } from '../../use-cases/sympla';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListSymplaEventsController {
  constructor(private readonly listSymplaEventsUseCase: ListSymplaEventsUseCase) {}

  async handle(organizationId: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const events = await this.listSymplaEventsUseCase.execute(organizationId);

      return ok({ items: events });
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
