import type { UpdateOrganizationRequest } from '@/core/communication/requests/organization';
import { AppError } from '@/core/errors';

import { UpdateOrganizationUseCase } from '../../use-cases/organization';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class UpdateOrganizationController {
  constructor(private readonly updateOrganizationUseCase: UpdateOrganizationUseCase) {}

  async handle(id: string, request: UpdateOrganizationRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const organization = await this.updateOrganizationUseCase.execute(id, request);

      return ok(organization.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
