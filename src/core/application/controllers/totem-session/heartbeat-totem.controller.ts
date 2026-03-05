import { HeartbeatTotemError, HeartbeatTotemUseCase } from '../../use-cases/totem-session';
import { badRequest, type ControllerResponse, noContent, serverError } from '../controller-response';

export class HeartbeatTotemController {
  constructor(private readonly heartbeatTotemUseCase: HeartbeatTotemUseCase) {}

  async handle(totemId: string): Promise<ControllerResponse<null>> {
    try {
      await this.heartbeatTotemUseCase.execute(totemId);

      return noContent();
    } catch (error) {
      if (error instanceof HeartbeatTotemError) {
        return badRequest(error.message);
      }

      return serverError();
    }
  }
}
