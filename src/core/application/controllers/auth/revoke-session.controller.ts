import { RevokeSessionError, RevokeSessionUseCase } from '../../use-cases/auth';
import { type ControllerResponse, noContent, notFound, serverError } from '../controller-response';

export class RevokeSessionController {
  constructor(private readonly revokeSessionUseCase: RevokeSessionUseCase) {}

  async handle(sessionId: string): Promise<ControllerResponse<null>> {
    try {
      await this.revokeSessionUseCase.execute(sessionId);

      return noContent();
    } catch (error) {
      if (error instanceof RevokeSessionError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
