import { IPersonFaceRepository } from '@/core/domain/contracts';
import type { PersonFaceEntity } from '@/core/domain/entities';

export class ListFacesUseCase {
  constructor(private readonly personFaceRepository: IPersonFaceRepository) {}

  async execute(personId: string): Promise<PersonFaceEntity[]> {
    return this.personFaceRepository.findActiveByPerson(personId);
  }
}
