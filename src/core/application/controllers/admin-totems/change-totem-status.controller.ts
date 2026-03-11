import type { TotemStatus } from '@/core/domain/entities';
import { AppError } from '@/core/errors';

import { ChangeTotemStatusUseCase } from '../../use-cases/admin-totems';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ChangeTotemStatusController {
  constructor(private readonly changeTotemStatusUseCase: ChangeTotemStatusUseCase) {}

  async handle(id: string, status: TotemStatus): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const totem = await this.changeTotemStatusUseCase.execute(id, status);

      return ok(totem.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
