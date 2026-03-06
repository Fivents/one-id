import { AppError } from '@/core/errors';

import { GenerateTotemAccessTokenUseCase } from '../../use-cases/admin-totems';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GenerateTotemAccessTokenController {
  constructor(private readonly generateTotemAccessTokenUseCase: GenerateTotemAccessTokenUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const totem = await this.generateTotemAccessTokenUseCase.execute(id);

      return ok(totem.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
