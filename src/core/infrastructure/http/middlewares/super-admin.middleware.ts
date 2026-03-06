import { NextRequest, NextResponse } from 'next/server';

import type { RouteContext, RouteHandler } from '../types';
import { getAuthContext } from '../types';

const SUPER_ADMIN_DOMAIN = 'fivents.com';

export function withSuperAdmin(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context: RouteContext): Promise<Response> => {
    const auth = getAuthContext(req);

    if (auth.type !== 'user') {
      return NextResponse.json({ error: 'Forbidden. Only users can access this resource.' }, { status: 403 });
    }

    if (auth.role !== 'SUPER_ADMIN' || !auth.email.endsWith(`@${SUPER_ADMIN_DOMAIN}`)) {
      return NextResponse.json({ error: 'Forbidden. Super admin access required.' }, { status: 403 });
    }

    return handler(req, context);
  };
}
