import { ActivateTotemError, ActivateTotemUseCase } from '../../use-cases/totem';
import { badRequest, type ControllerResponse, noContent, serverError } from '../controller-response';

export class ActivateTotemController {
  constructor(private readonly activateTotemUseCase: ActivateTotemUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.activateTotemUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof ActivateTotemError) {
        return badRequest(error.message);
      }

      return serverError();
    }
  }
}
