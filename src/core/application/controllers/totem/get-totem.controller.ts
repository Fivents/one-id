import { GetTotemError, GetTotemUseCase } from '../../use-cases/totem';
import { type ControllerResponse, notFound, ok, serverError } from '../controller-response';

export class GetTotemController {
  constructor(private readonly getTotemUseCase: GetTotemUseCase) {}

  async handle(id: string): Promise<ControllerResponse<Record<string, unknown>>> {
    try {
      const totem = await this.getTotemUseCase.execute(id);

      return ok(totem.toJSON());
    } catch (error) {
      if (error instanceof GetTotemError) {
        return notFound(error.message);
      }

      return serverError();
    }
  }
}
