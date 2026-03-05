import { DeactivatePlanError, DeactivatePlanUseCase } from '../../use-cases/plan';
import { badRequest, type ControllerResponse, noContent, serverError } from '../controller-response';

export class DeactivatePlanController {
  constructor(private readonly deactivatePlanUseCase: DeactivatePlanUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deactivatePlanUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof DeactivatePlanError) {
        return badRequest(error.message);
      }

      return serverError();
    }
  }
}
