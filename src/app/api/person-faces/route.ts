import { NextRequest, NextResponse } from 'next/server';

import { makeRegisterFaceController } from '@/core/application/controller-factories';
import { registerFaceRequestSchema } from '@/core/communication/requests/person-face';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { prisma } from '@/core/infrastructure/prisma-client';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { assertOrganizationAccess } from '../people/_lib/access';

export const POST = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(registerFaceRequestSchema, body);

      const person = await prisma.person.findUnique({
        where: { id: data.personId, deletedAt: null },
        select: { organizationId: true },
      });

      if (!person) {
        return NextResponse.json({ error: 'Person not found.' }, { status: 404 });
      }

      const accessError = await assertOrganizationAccess(req, person.organizationId);
      if (accessError) {
        return accessError;
      }

      const controller = makeRegisterFaceController();
      const result = await controller.handle(data);

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
