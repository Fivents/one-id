import type { PersonFaceEntity } from '../entities/person-face.entity';

export interface CreatePersonFaceData {
  embedding: Buffer;
  imageHash: string;
  imageUrl: string;
  personId: string;
}

export interface IPersonFaceRepository {
  findActiveByPerson(personId: string): Promise<PersonFaceEntity[]>;
  create(data: CreatePersonFaceData): Promise<PersonFaceEntity>;
  deactivate(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
}
