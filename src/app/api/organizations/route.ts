import { NextRequest, NextResponse } from 'next/server';

import {
  makeCreateOrganizationController,
  makeListOrganizationsController,
} from '@/core/application/controller-factories';
import { createOrganizationRequestSchema } from '@/core/communication/requests/organization';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withRBAC(['ORGANIZATION_VIEW'], async () => {
    const controller = makeListOrganizationsController();
    const result = await controller.handle();

    return toNextResponse(result);
  }),
);

export const POST = withAuth(
  withRBAC(['ORGANIZATION_CREATE'], async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = parseWithZod(createOrganizationRequestSchema, body);

      const controller = makeCreateOrganizationController();
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
