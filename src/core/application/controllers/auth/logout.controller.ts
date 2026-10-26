import { LogoutUseCase } from '../../use-cases/auth';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class LogoutController {
  constructor(private readonly logoutUseCase: LogoutUseCase) {}

  async handle(sessionId: string): Promise<ControllerResponse<null>> {
    try {
      await this.logoutUseCase.execute(sessionId);

      return noContent();
    } catch {
      return serverError();
    }
  }
}
