import { LogoutUseCase } from '../../use-cases/auth';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class LogoutController {
  constructor(private readonly logoutUseCase: LogoutUseCase) {}

  async handle(userId: string): Promise<ControllerResponse<null>> {
    try {
      await this.logoutUseCase.execute(userId);

      return noContent();
    } catch {
      return serverError();
    }
  }
}
