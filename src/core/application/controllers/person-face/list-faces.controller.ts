import { ListFacesUseCase } from '../../use-cases/person-face';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListFacesController {
  constructor(private readonly listFacesUseCase: ListFacesUseCase) {}

  async handle(personId: string): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const faces = await this.listFacesUseCase.execute(personId);

      return ok(faces.map((f) => f.toJSON()));
    } catch {
      return serverError();
    }
  }
}
