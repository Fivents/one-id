import { RegisterFaceCheckInError, RegisterFaceCheckInUseCase } from '../../use-cases/check-in';
import { conflict, type ControllerResponse, created, serverError } from '../controller-response';

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
      if (error instanceof RegisterFaceCheckInError) {
        return conflict(error.message);
      }

      return serverError();
    }
  }
}
