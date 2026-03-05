import { NextRequest, NextResponse } from 'next/server';

import type { Permission } from '@/core/domain/value-objects/permission';
import { hasPermission } from '@/core/domain/value-objects/permission';

import type { RouteContext, RouteHandler } from '../types';
import { getAuthContext } from '../types';

export function withRBAC(permissions: Permission[], handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context: RouteContext): Promise<Response> => {
    const auth = getAuthContext(req);

    if (auth.type === 'totem') {
      return NextResponse.json({ error: 'Forbidden. Totems cannot access this resource.' }, { status: 403 });
    }

    if (auth.role === 'SUPER_ADMIN') {
      return handler(req, context);
    }

    if (!hasPermission(auth.role, permissions)) {
      return NextResponse.json({ error: 'Forbidden. Insufficient permissions.' }, { status: 403 });
    }

    return handler(req, context);
  };
}
