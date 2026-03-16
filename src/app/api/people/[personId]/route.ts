import { NextRequest, NextResponse } from 'next/server';

import {
  makeDeletePersonController,
  makeGetPersonController,
  makeUpdatePersonController,
} from '@/core/application/controller-factories';
import { updatePersonRequestSchema } from '@/core/communication/requests/person';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { getAuthorizedPerson } from '../_lib/access';

export const GET = withAuth(
  withRBAC(['PARTICIPANT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { personId } = await context.params;

    const personOrResponse = await getAuthorizedPerson(req, personId);
    if (personOrResponse instanceof Response) {
      return personOrResponse;
    }

    const controller = makeGetPersonController();
    const result = await controller.handle(personId);

    return toNextResponse(result);
  }),
);

export const PATCH = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { personId } = await context.params;

      const personOrResponse = await getAuthorizedPerson(req, personId);
      if (personOrResponse instanceof Response) {
        return personOrResponse;
      }

      const body = await req.json();
      const data = parseWithZod(updatePersonRequestSchema, body);

      const controller = makeUpdatePersonController();
      const result = await controller.handle(personId, data);

      return toNextResponse(result);
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
    const { personId } = await context.params;

    const personOrResponse = await getAuthorizedPerson(req, personId);
    if (personOrResponse instanceof Response) {
      return personOrResponse;
    }

    const controller = makeDeletePersonController();
    const result = await controller.handle(personId);

    return toNextResponse(result);
  }),
);
