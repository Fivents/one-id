import { AppError } from '@/core/errors';

import { RegisterQrCheckInUseCase } from '../../use-cases/check-in';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class RegisterQrCheckInController {
  constructor(private readonly registerQrCheckInUseCase: RegisterQrCheckInUseCase) {}

  async handle(input: {
    eventParticipantId: string;
    totemEventSubscriptionId: string;
  }): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const checkIn = await this.registerQrCheckInUseCase.execute(input);

      return created(checkIn.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
