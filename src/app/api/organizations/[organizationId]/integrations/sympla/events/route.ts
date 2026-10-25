import { NextRequest } from 'next/server';

import { makeListSymplaEventsController } from '@/core/application/controller-factories';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';

import { assertOrganizationAccess } from '../../../../_lib/access';

/** Events visible to the organization's Sympla token, for the link picker. */
export const GET = withAuth(
  withRBAC(['EVENT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    const { organizationId } = await context.params;

    const accessError = await assertOrganizationAccess(req, organizationId);
    if (accessError) {
      return accessError;
    }

    const controller = makeListSymplaEventsController();
    const result = await controller.handle(organizationId);

    return toNextResponse(result);
  }),
);
