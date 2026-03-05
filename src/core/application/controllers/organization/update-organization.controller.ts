import type { UpdateOrganizationRequest } from '@/core/communication/requests/organization';

import { UpdateOrganizationError, UpdateOrganizationUseCase } from '../../use-cases/organization';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class UpdateOrganizationController {
  constructor(private readonly updateOrganizationUseCase: UpdateOrganizationUseCase) {}

  async handle(id: string, request: UpdateOrganizationRequest): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const organization = await this.updateOrganizationUseCase.execute(id, request);

      return ok(organization.toJSON());
    } catch (error) {
      if (error instanceof UpdateOrganizationError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
