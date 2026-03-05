import { NextRequest } from 'next/server';

import { makeRevokeSessionController } from '@/core/application/controller-factories';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';

export const DELETE = withAuth(
  withRBAC(['USER_VIEW'], async (_req: NextRequest, context: RouteContext) => {
    const { sessionId } = await context.params;

    const controller = makeRevokeSessionController();
    const result = await controller.handle(sessionId);

    return toNextResponse(result);
  }),
);
