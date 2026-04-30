import { RemoveFaceUseCase } from '../../use-cases/person-face';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class RemoveFaceController {
  constructor(private readonly removeFaceUseCase: RemoveFaceUseCase) {}

  async handle(id: string): Promise<ControllerResponse<null>> {
    try {
      await this.removeFaceUseCase.execute(id);

      return noContent();
    } catch {
      return serverError();
    }
  }
}
