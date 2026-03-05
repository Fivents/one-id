import { UnlinkTotemFromOrgError, UnlinkTotemFromOrgUseCase } from '../../use-cases/totem-organization-subscription';
import { type ControllerResponse, noContent, notFound, serverError } from '../controller-response';

export class UnlinkTotemFromOrgController {
  constructor(private readonly unlinkTotemFromOrgUseCase: UnlinkTotemFromOrgUseCase) {}

  async handle(subscriptionId: string): Promise<ControllerResponse<null>> {
    try {
      await this.unlinkTotemFromOrgUseCase.execute(subscriptionId);

      return noContent();
    } catch (error) {
      if (error instanceof UnlinkTotemFromOrgError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
