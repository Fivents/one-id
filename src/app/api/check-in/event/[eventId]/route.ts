import { NextRequest } from 'next/server';

import { makeListEventCheckInsController } from '@/core/application/controller-factories';
import { withAuth, withTotemAuth } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import type { RouteContext } from '@/core/infrastructure/http/types';

export const GET = withAuth(
  withTotemAuth(async (_req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const controller = makeListEventCheckInsController();
    const result = await controller.handle(eventId);

    return toNextResponse(result);
  }),
);
