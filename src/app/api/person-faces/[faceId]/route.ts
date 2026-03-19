import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import { makeRemoveFaceController } from '@/core/application/controller-factories';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { assertOrganizationAccess } from '../../people/_lib/access';

const FACE_EMBEDDING_DIMENSION = 512;

const updateFaceSchema = z
  .object({
    imageUrl: z.string().url().optional(),
    imageDataUrl: z.string().min(1).optional(),
    embedding: z
      .array(z.number().finite())
      .length(FACE_EMBEDDING_DIMENSION, `Embedding must contain ${FACE_EMBEDDING_DIMENSION} dimensions.`),
    embeddingModel: z.string().min(1).max(120).optional(),
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

      const storedImageUrl = data.imageUrl ?? (data.imageDataUrl ? 'captured://runtime-embedding' : face.imageUrl);
      const faceFeatures = {
        imageHash: `runtime-embedding-${Date.now()}`,
        storedImageUrl,
        embedding: Buffer.from(new Float32Array(data.embedding).buffer),
      };

      const updated = await prisma.personFace.update({
        where: { id: faceId },
        data: {
          imageHash: faceFeatures.imageHash,
          imageUrl: faceFeatures.storedImageUrl,
          isActive: data.isActive,
          embedding: new Uint8Array(faceFeatures.embedding),
        },
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
