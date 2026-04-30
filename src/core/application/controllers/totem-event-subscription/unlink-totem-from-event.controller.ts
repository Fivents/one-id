import { AppError } from '@/core/errors';

import { UnlinkTotemFromEventUseCase } from '../../use-cases/totem-event-subscription';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class UnlinkTotemFromEventController {
  constructor(private readonly unlinkTotemFromEventUseCase: UnlinkTotemFromEventUseCase) {}

  async handle(subscriptionId: string): Promise<ControllerResponse<null>> {
    try {
      await this.unlinkTotemFromEventUseCase.execute(subscriptionId);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
