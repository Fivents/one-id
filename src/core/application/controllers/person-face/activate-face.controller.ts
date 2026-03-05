import { ActivateFaceUseCase } from '../../use-cases/person-face';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class ActivateFaceController {
  constructor(private readonly activateFaceUseCase: ActivateFaceUseCase) {}

  async handle(personId: string, faceId: string): Promise<ControllerResponse<null>> {
    try {
      await this.activateFaceUseCase.execute(personId, faceId);

      return noContent();
    } catch {
      return serverError();
    }
  }
}
