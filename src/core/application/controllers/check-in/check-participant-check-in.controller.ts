import { CheckParticipantCheckInUseCase } from '../../use-cases/check-in';
import { type ControllerResponse, ok, serverError } from '../controller-response';

interface CheckParticipantCheckInResponse {
  checkedIn: boolean;
  checkInId?: string;
}

export class CheckParticipantCheckInController {
  constructor(private readonly checkParticipantCheckInUseCase: CheckParticipantCheckInUseCase) {}

  async handle(
    eventParticipantId: string,
    totemEventSubscriptionId: string,
  ): Promise<ControllerResponse<CheckParticipantCheckInResponse>> {
    try {
      const result = await this.checkParticipantCheckInUseCase.execute(eventParticipantId, totemEventSubscriptionId);

      return ok(result);
    } catch {
      return serverError();
    }
  }
}
