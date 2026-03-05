import { DeactivateTotemError, DeactivateTotemUseCase } from '../../use-cases/totem';
import { badRequest, type ControllerResponse, noContent, serverError } from '../controller-response';

export class DeactivateTotemController {
  constructor(private readonly deactivateTotemUseCase: DeactivateTotemUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deactivateTotemUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof DeactivateTotemError) {
        return badRequest(error.message);
      }

      return serverError();
    }
  }
}
