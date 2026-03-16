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

const updateFaceSchema = z.object({
  embedding: z.string().min(1).optional(),
  imageHash: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
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

      const updated = await prisma.personFace.update({
        where: { id: faceId },
        data: {
          imageHash: data.imageHash,
          imageUrl: data.imageUrl,
          isActive: data.isActive,
          ...(data.embedding ? { embedding: new Uint8Array(Buffer.from(data.embedding, 'base64')) } : {}),
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
