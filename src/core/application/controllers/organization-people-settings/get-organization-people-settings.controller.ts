import { AppError } from '@/core/errors';

import { GetOrganizationPeopleSettingsUseCase } from '../../use-cases/organization-people-settings';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GetOrganizationPeopleSettingsController {
  constructor(private readonly getOrganizationPeopleSettingsUseCase: GetOrganizationPeopleSettingsUseCase) {}

  async handle(organizationId: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const settings = await this.getOrganizationPeopleSettingsUseCase.execute(organizationId);

      return ok(settings.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
