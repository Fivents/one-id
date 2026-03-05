import { IPersonFaceRepository } from '@/core/domain/contracts';

export class DeactivateFaceUseCase {
  constructor(private readonly personFaceRepository: IPersonFaceRepository) {}

  async execute(id: string): Promise<void> {
    await this.personFaceRepository.deactivate(id);
  }
}
