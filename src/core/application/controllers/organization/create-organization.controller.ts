import type { CreateOrganizationRequest } from '@/core/communication/requests/organization';
import { AppError } from '@/core/errors';

import { CreateOrganizationUseCase } from '../../use-cases/organization';
import { type ControllerResponse, created, serverError } from '../controller-response';

export class CreateOrganizationController {
  constructor(private readonly createOrganizationUseCase: CreateOrganizationUseCase) {}

  async handle(request: CreateOrganizationRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const organization = await this.createOrganizationUseCase.execute(request);

      return created(organization.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
