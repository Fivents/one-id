import { SetMaintenanceTotemError, SetMaintenanceTotemUseCase } from '../../use-cases/totem';
import { badRequest, type ControllerResponse, noContent, serverError } from '../controller-response';

export class SetMaintenanceTotemController {
  constructor(private readonly setMaintenanceTotemUseCase: SetMaintenanceTotemUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.setMaintenanceTotemUseCase.execute(id);

      return noContent();
    } catch (error) {
      if (error instanceof SetMaintenanceTotemError) {
        return badRequest(error.message);
      }

      return serverError();
    }
  }
}
