import { NextRequest, NextResponse } from 'next/server';

import {
  makeConnectSymplaController,
  makeDisconnectSymplaController,
  makeGetSymplaConnectionStatusController,
} from '@/core/application/controller-factories';
import { connectSymplaRequestSchema } from '@/core/communication/requests/sympla';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { getUserAuth } from '@/core/infrastructure/http/types';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { assertOrganizationAccess } from '../../../_lib/access';

export const GET = withAuth(
  withRBAC(['ORGANIZATION_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { organizationId } = await context.params;

    const accessError = await assertOrganizationAccess(req, organizationId);
    if (accessError) {
      return accessError;
    }

    const controller = makeGetSymplaConnectionStatusController();
    const result = await controller.handle(organizationId);

    return toNextResponse(result);
  }),
);

export const POST = withAuth(
  withRBAC(['ORGANIZATION_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { organizationId } = await context.params;

      const accessError = await assertOrganizationAccess(req, organizationId);
      if (accessError) {
        return accessError;
      }

      const body = await req.json();
      const data = parseWithZod(connectSymplaRequestSchema, body);
      const auth = getUserAuth(req);

      const controller = makeConnectSymplaController();
      const result = await controller.handle(organizationId, data, { userId: auth.userId });

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
  withRBAC(['ORGANIZATION_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { organizationId } = await context.params;

      const accessError = await assertOrganizationAccess(req, organizationId);
      if (accessError) {
        return accessError;
      }

      const auth = getUserAuth(req);

      const controller = makeDisconnectSymplaController();
      const result = await controller.handle(organizationId, { userId: auth.userId });

      return toNextResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.httpStatus });
      }

      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
