import { ListFeaturesUseCase } from '../../use-cases/feature';
import { type ControllerResponse, ok, serverError } from '../controller-response';

export class ListFeaturesController {
  constructor(private readonly listFeaturesUseCase: ListFeaturesUseCase) {}

  async handle(): Promise<ControllerResponse<Record<string, unknown>[]>> {
    try {
      const features = await this.listFeaturesUseCase.execute();

      return ok(features.map((f) => f.toJSON()));
    } catch {
      return serverError();
    }
  }
}
