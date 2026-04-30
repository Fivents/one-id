import { AppError } from '@/core/errors';

import { RevokeTotemAccessCodeUseCase } from '../../use-cases/admin-totems';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class RevokeTotemAccessCodeController {
  constructor(private readonly revokeTotemAccessCodeUseCase: RevokeTotemAccessCodeUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const totem = await this.revokeTotemAccessCodeUseCase.execute(id);

      return ok(totem.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
