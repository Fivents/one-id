import { NextRequest, NextResponse } from 'next/server';

import { containerService } from '@/core/application/services';
import { verifyUserSession } from '@/core/application/services/user-session';
import { getPermissionsForRole } from '@/core/domain/value-objects/permission';

import type { RouteContext, RouteHandler, TotemAuthContext, UserAuthContext } from '../types';
import { setAuthContext } from '../types';

function extractToken(req: NextRequest): string | null {
  // Prefer explicit Authorization header over cookie.
  // This prevents an admin cookie from overriding the totem Authorization header
  // when both are sent in the same request (e.g., testing totem in a browser
  // where the user is also logged into the admin panel).
  const header = req.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);

  const cookie = req.cookies.get('auth-token')?.value;
  if (cookie) return cookie;

  return null;
}

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context: RouteContext): Promise<Response> => {
    const token = extractToken(req);

    if (!token) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const tokenProvider = containerService.getTokenProvider();
    const sessionRepository = containerService.getSessionRepository();

    // Try user token first, then totem token. The route handler runs outside these try
    // blocks: an exception thrown by the route must surface as itself, not as a 401.
    let userContext: UserAuthContext | null = null;
    try {
      // Checks the session too, so logged-out or revoked tokens stop working immediately.
      const payload = await verifyUserSession({ tokenProvider, sessionRepository }, token);

      userContext = {
        type: 'user',
        userId: payload.sub,
        sessionId: payload.sid,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        organizationId: payload.organizationId,
        permissions: getPermissionsForRole(payload.role),
      };
    } catch {
      // Not a valid user session, try totem
    }

    if (userContext) {
      setAuthContext(req, userContext);
      return handler(req, context);
    }

    let totemContext: TotemAuthContext;
    try {
      const payload = await tokenProvider.verifyTotemToken(token);

      totemContext = {
        type: 'totem',
        totemId: payload.sub,
        totemName: payload.name,
      };
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
    }

    setAuthContext(req, totemContext);
    return handler(req, context);
  };
}
