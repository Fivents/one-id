import { AppError } from '@/core/errors';

import { GenerateTotemAccessCodeUseCase } from '../../use-cases/admin-totems';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class GenerateTotemAccessCodeController {
  constructor(private readonly generateTotemAccessCodeUseCase: GenerateTotemAccessCodeUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const totem = await this.generateTotemAccessCodeUseCase.execute(id);

      return ok(totem.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
