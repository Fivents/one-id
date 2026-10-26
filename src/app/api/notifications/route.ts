import { NextRequest } from 'next/server';

import { makeListNotificationsController } from '@/core/application/controller-factories';
import { withAuth } from '@/core/infrastructure/http/middlewares';
import { toNextResponse } from '@/core/infrastructure/http/to-next-response';
import { getUserAuth } from '@/core/infrastructure/http/types';

// The client has always called GET /api/notifications on app load, but the route was never
// created, so every session logged a 404. Only the caller's own notifications are listed.
export const GET = withAuth(async (req: NextRequest) => {
  const { userId } = getUserAuth(req);
  const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true';

  const controller = makeListNotificationsController();
  const result = await controller.handle(userId, unreadOnly);

  return toNextResponse(result);
});
