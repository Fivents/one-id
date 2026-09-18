import { AppError } from '@/core/errors';

import type { GetSymplaConnectionStatusUseCase } from '../../use-cases/sympla';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GetSymplaConnectionStatusController {
  constructor(private readonly getStatusUseCase: GetSymplaConnectionStatusUseCase) {}

  async handle(organizationId: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const connection = await this.getStatusUseCase.execute(organizationId);

      // "Not connected" is a normal state for an organization, not a 404 — the settings page
      // needs a body either way to decide what to render.
      if (!connection) {
        return ok({ connected: false });
      }

      return ok({ connected: true, ...connection.toJSON() });
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
