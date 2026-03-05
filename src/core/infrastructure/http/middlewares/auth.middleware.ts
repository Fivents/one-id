import { NextRequest, NextResponse } from 'next/server';

import { getPermissionsForRole } from '@/core/domain/value-objects/permission';
import { serviceContainer } from '@/core/infrastructure/database/service-container';

import type { RouteContext, RouteHandler, TotemAuthContext, UserAuthContext } from '../types';
import { setAuthContext } from '../types';

function extractToken(req: NextRequest): string | null {
  const cookie = req.cookies.get('auth-token')?.value;
  if (cookie) return cookie;

  const header = req.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);

  return null;
}

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context: RouteContext): Promise<Response> => {
    const token = extractToken(req);

    if (!token) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const tokenProvider = serviceContainer.getTokenProvider();

    // Try user token first, then totem token
    try {
      const payload = await tokenProvider.verifyUserToken(token);

      const authContext: UserAuthContext = {
        type: 'user',
        userId: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        organizationId: payload.organizationId,
        permissions: getPermissionsForRole(payload.role),
      };

      setAuthContext(req, authContext);
      return handler(req, context);
    } catch {
      // Not a valid user token, try totem
    }

    try {
      const payload = await tokenProvider.verifyTotemToken(token);

      const authContext: TotemAuthContext = {
        type: 'totem',
        totemSessionId: payload.sub,
        totemName: payload.name,
      };

      setAuthContext(req, authContext);
      return handler(req, context);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
    }
  };
}
