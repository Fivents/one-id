import { NextResponse } from 'next/server';

import { makeListDeletedUsersController } from '@/core/application/controller-factories';
import { withAuth } from '@/core/infrastructure/http/middlewares/auth.middleware';
import { withSuperAdmin } from '@/core/infrastructure/http/middlewares/super-admin.middleware';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';

export const GET = withAuth(
  withSuperAdmin(async () => {
    try {
      const controller = makeListDeletedUsersController();
      const result = await controller.handle();

      return toNextResponse(result);
    } catch {
      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
  }),
);
