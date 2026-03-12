import { NextRequest, NextResponse } from 'next/server';

import {
  makeActivateOrganizationController,
  makeDeactivateOrganizationController,
} from '@/core/application/controller-factories';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';

export const PATCH = withAuth(
  withRBAC(['ORGANIZATION_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { organizationId } = await context.params;
      const body = await req.json();
      const { isActive } = body as { isActive: boolean };

      if (isActive) {
        const controller = makeActivateOrganizationController();
        const result = await controller.handle(organizationId);
        return toNextResponse(result);
      } else {
        const controller = makeDeactivateOrganizationController();
        const result = await controller.handle(organizationId);
        return toNextResponse(result);
      }
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
