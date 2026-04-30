import { AppError } from '@/core/errors';

import { DeactivateOrganizationUseCase } from '../../use-cases/organization';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class DeactivateOrganizationController {
  constructor(private readonly deactivateOrganizationUseCase: DeactivateOrganizationUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const organization = await this.deactivateOrganizationUseCase.execute(id);

      return ok(organization.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
