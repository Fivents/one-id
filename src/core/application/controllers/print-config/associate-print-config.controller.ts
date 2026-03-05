import { AssociatePrintConfigError, AssociatePrintConfigUseCase } from '../../use-cases/print-config';
import { conflict, type ControllerResponse, ok, serverError } from '../controller-response';

export class AssociatePrintConfigController {
  constructor(private readonly associatePrintConfigUseCase: AssociatePrintConfigUseCase) {}

  async handle(eventId: string, printConfigId: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const event = await this.associatePrintConfigUseCase.execute(eventId, printConfigId);

      return ok(event.toJSON());
    } catch (error) {
      if (error instanceof AssociatePrintConfigError) {
        return conflict(error.message);
      }

      return serverError();
    }
  }
}
