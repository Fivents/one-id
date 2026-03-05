import type { CreatePersonFaceData, IPersonFaceRepository } from '@/core/domain/contracts';
import { PersonFaceEntity } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaPersonFaceRepository implements IPersonFaceRepository {
  constructor(private readonly db: PrismaClient) {}

  async findActiveByPerson(personId: string): Promise<PersonFaceEntity[]> {
    const faces = await this.db.personFace.findMany({
      where: { personId, isActive: true, deletedAt: null },
    });

    return faces.map((face) =>
      PersonFaceEntity.create({
        id: face.id,
        embedding: Buffer.from(face.embedding),
        imageHash: face.imageHash,
        imageUrl: face.imageUrl,
        personId: face.personId,
        isActive: face.isActive,
        createdAt: face.createdAt,
        updatedAt: face.updatedAt,
        deletedAt: face.deletedAt,
      }),
    );
  }

  async create(data: CreatePersonFaceData): Promise<PersonFaceEntity> {
    const face = await this.db.personFace.create({
      data: {
        embedding: new Uint8Array(data.embedding),
        imageHash: data.imageHash,
        imageUrl: data.imageUrl,
        personId: data.personId,
      },
    });

    return PersonFaceEntity.create({
      id: face.id,
      embedding: Buffer.from(face.embedding),
      imageHash: face.imageHash,
      imageUrl: face.imageUrl,
      personId: face.personId,
      isActive: face.isActive,
      createdAt: face.createdAt,
      updatedAt: face.updatedAt,
      deletedAt: face.deletedAt,
    });
  }

  async deactivate(id: string): Promise<void> {
    await this.db.personFace.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.personFace.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
