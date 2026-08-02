import type { UpdateOrganizationPeopleSettingsRequest } from '@/core/communication/requests/organization-people-settings';
import { AppError } from '@/core/errors';

import { UpdateOrganizationPeopleSettingsUseCase } from '../../use-cases/organization-people-settings';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdateOrganizationPeopleSettingsController {
  constructor(private readonly updateOrganizationPeopleSettingsUseCase: UpdateOrganizationPeopleSettingsUseCase) {}

  async handle(
    organizationId: string,
    request: UpdateOrganizationPeopleSettingsRequest,
  ): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const settings = await this.updateOrganizationPeopleSettingsUseCase.execute(organizationId, request);

      return ok(settings.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
