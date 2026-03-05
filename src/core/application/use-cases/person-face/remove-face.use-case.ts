import { IPersonFaceRepository } from '@/core/domain/contracts';

export class RemoveFaceUseCase {
  constructor(private readonly personFaceRepository: IPersonFaceRepository) {}

  async execute(id: string): Promise<void> {
    await this.personFaceRepository.softDelete(id);
  }
}
