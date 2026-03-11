import { BulkHardDeleteTotemsUseCase } from '../../use-cases/admin-totems';
import { type ControllerResponse, noContent, serverError } from '../controller-response';

export class BulkHardDeleteTotemsController {
  constructor(private readonly bulkHardDeleteTotemsUseCase: BulkHardDeleteTotemsUseCase) {}

  async handle(totemIds: string[]): Promise<ControllerResponse<null>> {
    try {
      await this.bulkHardDeleteTotemsUseCase.execute(totemIds);
      return noContent();
    } catch {
      return serverError();
    }
  }
}
