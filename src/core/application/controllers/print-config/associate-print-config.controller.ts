import { AppError } from '@/core/errors';

import { AssociatePrintConfigUseCase } from '../../use-cases/print-config';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class AssociatePrintConfigController {
  constructor(private readonly associatePrintConfigUseCase: AssociatePrintConfigUseCase) {}

  async handle(eventId: string, printConfigId: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const event = await this.associatePrintConfigUseCase.execute(eventId, printConfigId);

      return ok(event.toJSON());
    } catch (error) {
      if (error instanceof AppError) {
        return { statusCode: error.httpStatus, body: { error: error.message } };
      }

      return serverError();
    }
  }
}
