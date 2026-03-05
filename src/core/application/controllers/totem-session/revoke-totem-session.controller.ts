import { RevokeTotemSessionUseCase } from '../../use-cases/totem-session';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class RevokeTotemSessionController {
  constructor(private readonly revokeTotemSessionUseCase: RevokeTotemSessionUseCase) {}

  async handle(totemId: string): Promise<ControllerResponse<null>> {
    try {
      await this.revokeTotemSessionUseCase.execute(totemId);

      return noContent();
    } catch {
      return serverError();
    }
  }
}
