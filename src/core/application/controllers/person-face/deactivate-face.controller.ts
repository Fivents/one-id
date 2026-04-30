import { DeactivateFaceUseCase } from '../../use-cases/person-face';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class DeactivateFaceController {
  constructor(private readonly deactivateFaceUseCase: DeactivateFaceUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.deactivateFaceUseCase.execute(id);

      return noContent();
    } catch {
      return serverError();
    }
  }
}
