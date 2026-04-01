import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { makeRemoveFaceController } from '@/core/application/controller-factories';
import { containerService } from '@/core/application/services/container.service';
import { faceEmbeddingSchema } from '@/core/communication/requests/person-face';
import { AppError } from '@/core/errors';
import { ErrorCode } from '@/core/errors/error-codes';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { assertOrganizationAccess } from '../../people/_lib/access';

const updateFaceSchema = z
  .object({
    imageUrl: z.string().url().optional(),
    imageDataUrl: z.string().min(1).optional(),
    embedding: faceEmbeddingSchema,
    embeddingModel: z.string().min(1).max(120).optional(),
    faceDetectionData: z.record(z.string(), z.unknown()),
    isActive: z.boolean().optional(),
  })
  .refine((data) => !(data.imageUrl && data.imageDataUrl), {
    message: 'Provide only one source: imageUrl or imageDataUrl.',
    path: ['imageDataUrl'],
  });

export const PATCH = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { faceId } = await context.params;

      const face = await prisma.personFace.findUnique({
        where: { id: faceId, deletedAt: null },
        include: { person: { select: { organizationId: true } } },
      });

      if (!face) {
        return NextResponse.json({ error: 'Face not found.' }, { status: 404 });
      }

      const accessError = await assertOrganizationAccess(req, face.person.organizationId);
      if (accessError) {
        return accessError;
      }

      const body = await req.json();
      const data = parseWithZod(updateFaceSchema, body);

      const faceQualityService = containerService.getFaceQualityService();
      const qualityScore = faceQualityService.assessQuality(data.faceDetectionData);

      if (!faceQualityService.isQualityAcceptable(qualityScore)) {
        const feedback = faceQualityService.getQualityFeedback(qualityScore);
        throw new AppError({
          code: ErrorCode.INVALID_FACE_QUALITY,
          message: `Face quality too low. Score: ${qualityScore.overallScore.toFixed(2)}/1.00. ${feedback.join('; ')}`,
          httpStatus: 400,
          level: 'warning',
          context: {
            qualityScore: qualityScore.overallScore,
            threshold: 0.65,
            failures: qualityScore.assessmentDetails.failures,
          },
        });
      }

      const storedImageUrl = data.imageUrl ?? (data.imageDataUrl ? 'captured://runtime-embedding' : face.imageUrl);
      const faceFeatures = {
        imageHash: `runtime-embedding-${Date.now()}`,
        storedImageUrl,
        embedding: Buffer.from(new Float32Array(data.embedding).buffer),
      };

      const embeddingVector = `[${data.embedding.join(',')}]`;

      const updated = await prisma.$transaction(async (tx) => {
        const updatedFace = await tx.personFace.update({
          where: { id: faceId },
          data: {
            imageHash: faceFeatures.imageHash,
            imageUrl: faceFeatures.storedImageUrl,
            isActive: data.isActive,
            embedding: new Uint8Array(faceFeatures.embedding),
            faceQualityScore: qualityScore.overallScore,
            faceQualityMetadata: JSON.parse(JSON.stringify(qualityScore.assessmentDetails)),
            embeddingModelVersion: data.embeddingModel,
          },
        });

        await tx.$executeRaw`
          UPDATE person_faces
          SET embedding_vector = ${embeddingVector}::vector,
              embedding_normalized = true,
              updated_at = NOW()
          WHERE id = ${faceId}
        `;

        return updatedFace;
      });

      return NextResponse.json(updated, { status: 200 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);

export const DELETE = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    const { faceId } = await context.params;

    const face = await prisma.personFace.findUnique({
      where: { id: faceId, deletedAt: null },
      include: { person: { select: { organizationId: true } } },
    });

    if (!face) {
      return NextResponse.json({ error: 'Face not found.' }, { status: 404 });
    }

    const accessError = await assertOrganizationAccess(req, face.person.organizationId);
    if (accessError) {
      return accessError;
    }

    const controller = makeRemoveFaceController();
    const result = await controller.handle(faceId);

    return toNextResponse(result);
  }),
);
