import { randomUUID } from 'node:crypto';

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
        // Store quality assessment data if provided
        ...(data.faceQualityScore !== undefined && { faceQualityScore: data.faceQualityScore }),
        ...(data.faceQualityMetadata !== undefined && {
          faceQualityMetadata: JSON.parse(JSON.stringify(data.faceQualityMetadata)),
        }),
        // Store model version for embedding compatibility tracking
        embeddingModelVersion: data.embeddingModelVersion ?? 'InsightFace:0.3.3',
        // Store template position for future multi-template support
        ...(data.templatePosition !== undefined && { faceTemplatePosition: data.templatePosition }),
        // Store template set ID for Phase 2 multi-pose grouping
        ...(data.templateSetId !== undefined && { templateSetId: data.templateSetId }),
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

  // ────── Phase 2 Multi-Template Methods ────────

  async findByPersonAndTemplateSet(
    personId: string,
    templateSetId: string,
  ): Promise<
    Array<{
      id: string;
      embedding: Buffer;
      faceQualityScore: number | null;
      faceTemplatePosition: string | null;
    }>
  > {
    const faces = await this.db.personFace.findMany({
      where: {
        personId,
        templateSetId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        embedding: true,
        faceQualityScore: true,
        faceTemplatePosition: true,
      },
    });

    return faces.map((f) => ({
      id: f.id,
      embedding: Buffer.from(f.embedding),
      faceQualityScore: f.faceQualityScore,
      faceTemplatePosition: f.faceTemplatePosition,
    }));
  }

  async findTemplateSetStatus(
    personId: string,
    templateSetId: string,
  ): Promise<{
    totalTemplates: number;
    positions: string[];
    complete: boolean;
  }> {
    const faces = await this.db.personFace.findMany({
      where: {
        personId,
        templateSetId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        faceTemplatePosition: true,
      },
    });

    const positions = faces
      .map((f) => f.faceTemplatePosition)
      .filter((p) => p !== null && p !== undefined) as string[];

    // Complete if all 5 poses present
    const requiredPositions = ['center', 'left', 'right', 'up', 'down'];
    const complete = requiredPositions.every((p) => positions.includes(p));

    return {
      totalTemplates: faces.length,
      positions: [...new Set(positions)], // unique positions
      complete,
    };
  }

  async getOrCreateTemplateSet(personId: string): Promise<string> {
    // Check if person has existing template set
    const existing = await this.db.personFace.findFirst({
      where: {
        personId,
        templateSetId: { not: null },
        deletedAt: null,
      },
      select: { templateSetId: true },
    });

    if (existing?.templateSetId) {
      return existing.templateSetId;
    }

    // Create new template set ID
    return `template_set_${randomUUID()}`;
  }
}
