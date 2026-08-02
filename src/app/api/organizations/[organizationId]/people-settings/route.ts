import { NextRequest, NextResponse } from 'next/server';

import {
  makeGetOrganizationPeopleSettingsController,
  makeUpdateOrganizationPeopleSettingsController,
} from '@/core/application/controller-factories';
import { updateOrganizationPeopleSettingsRequestSchema } from '@/core/communication/requests/organization-people-settings';
import { AppError } from '@/core/errors';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { parseWithZod } from '@/core/utils/parse-with-zod';

import { assertOrganizationAccess } from '../../_lib/access';

export const GET = withAuth(
  withRBAC(['PARTICIPANT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { organizationId } = await context.params;

    const accessError = await assertOrganizationAccess(req, organizationId);
    if (accessError) {
      return accessError;
    }

    const controller = makeGetOrganizationPeopleSettingsController();
    const result = await controller.handle(organizationId);

    return toNextResponse(result);
  }),
);

export const PATCH = withAuth(
  withRBAC(['PARTICIPANT_MANAGE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { organizationId } = await context.params;

      const accessError = await assertOrganizationAccess(req, organizationId);
      if (accessError) {
        return accessError;
      }

      const body = await req.json();
      const data = parseWithZod(updateOrganizationPeopleSettingsRequestSchema, body);

      const controller = makeUpdateOrganizationPeopleSettingsController();
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
