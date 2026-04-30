import { NextRequest, NextResponse } from 'next/server';

import {
  makeDeleteOrganizationController,
  makeGetOrganizationController,
  makeUpdateOrganizationController,
} from '@/core/application/controller-factories';
import { updateOrganizationRequestSchema } from '@/core/communication/requests/organization';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { parseWithZod } from '@/core/utils/parse-with-zod';

export const GET = withAuth(
  withRBAC(['ORGANIZATION_VIEW'], async (_req: NextRequest, context: RouteContext) => {
    const { organizationId } = await context.params;

    const controller = makeGetOrganizationController();
    const result = await controller.handle(organizationId);

    return toNextResponse(result);
  }),
);

export const PATCH = withAuth(
  withRBAC(['ORGANIZATION_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { organizationId } = await context.params;
      const body = await req.json();
      const data = parseWithZod(updateOrganizationRequestSchema, body);

      const controller = makeUpdateOrganizationController();
      const result = await controller.handle(organizationId, data);

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
  withRBAC(['ORGANIZATION_DELETE'], async (_req: NextRequest, context: RouteContext) => {
    try {
      const { organizationId } = await context.params;

      const controller = makeDeleteOrganizationController();
      const result = await controller.handle(organizationId);

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
