import { UnlinkTotemFromEventError, UnlinkTotemFromEventUseCase } from '../../use-cases/totem-event-subscription';
import { type ControllerResponse, noContent, notFound, serverError } from '../controller-response';

export class UnlinkTotemFromEventController {
  constructor(private readonly unlinkTotemFromEventUseCase: UnlinkTotemFromEventUseCase) {}

  async handle(subscriptionId: string): Promise<ControllerResponse<null>> {
    try {
      await this.unlinkTotemFromEventUseCase.execute(subscriptionId);

      return noContent();
    } catch (error) {
      if (error instanceof UnlinkTotemFromEventError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
