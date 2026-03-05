import { CreatePersonFaceData, IPersonFaceRepository } from '@/core/domain/contracts';
import type { PersonFaceEntity } from '@/core/domain/entities';

export class RegisterFaceUseCase {
  constructor(private readonly personFaceRepository: IPersonFaceRepository) {}

  async execute(data: CreatePersonFaceData): Promise<PersonFaceEntity> {
    return this.personFaceRepository.create(data);
  }
}
