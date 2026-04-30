import { NextRequest } from 'next/server';

import { makeListSessionsController } from '@/core/application/controller-factories';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { getUserAuth } from '@/core/infrastructure/http/types';

export const GET = withAuth(
  withRBAC(['USER_VIEW'], async (req: NextRequest) => {
    const auth = getUserAuth(req);

    const controller = makeListSessionsController();
    const result = await controller.handle(auth.userId);

    return toNextResponse(result);
  }),
);
