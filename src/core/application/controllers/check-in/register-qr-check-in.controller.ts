import { RegisterQrCheckInError, RegisterQrCheckInUseCase } from '../../use-cases/check-in';
import { conflict, type ControllerResponse, created, serverError } from '../controller-response';

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
      if (error instanceof RegisterQrCheckInError) {
        return conflict(error.message);
      }

      return serverError();
    }
  }
}
