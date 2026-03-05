import { AppError } from '@/core/errors';

import { UnlinkTotemFromOrgUseCase } from '../../use-cases/totem-organization-subscription';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class UnlinkTotemFromOrgController {
  constructor(private readonly unlinkTotemFromOrgUseCase: UnlinkTotemFromOrgUseCase) {}

  async handle(subscriptionId: string): Promise<ControllerResponse<null>> {
    try {
      await this.unlinkTotemFromOrgUseCase.execute(subscriptionId);

      return noContent();
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
