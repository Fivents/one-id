import { NextRequest, NextResponse } from 'next/server';

import type { RouteContext, RouteHandler } from '../types';
import { getAuthContext } from '../types';

export function withTotemAuth(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context: RouteContext): Promise<Response> => {
    const auth = getAuthContext(req);

    if (auth.type !== 'totem') {
      return NextResponse.json({ error: 'Forbidden. Only totems can access this resource.' }, { status: 403 });
    }

    return handler(req, context);
  };
}
