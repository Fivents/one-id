import { AppError } from '@/core/errors';

import { RegisterFaceCheckInUseCase } from '../../use-cases/check-in';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class RegisterFaceCheckInController {
  constructor(private readonly registerFaceCheckInUseCase: RegisterFaceCheckInUseCase) {}

  async handle(input: {
    eventParticipantId: string;
    totemEventSubscriptionId: string;
    confidence: number;
  }): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const checkIn = await this.registerFaceCheckInUseCase.execute(input);

      return created(checkIn.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
