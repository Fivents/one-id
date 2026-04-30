import { NextRequest, NextResponse } from 'next/server';

import type { RouteContext, RouteHandler } from '../types';
import { getAuthContext } from '../types';

/**
 * TotemRoutingGuard enforces that Totem sessions can ONLY access /totem/credentialing.
 * This prevents totem devices from escaping the kiosk mode to access other API endpoints.
 *
 * Exceptions:
 * - /api/totem/login (pre-auth, no guard needed)
 * - /api/totem/session (explicitly allowed, called from credentialing page)
 * - /api/totem/checkin (explicitly allowed, called from credentialing page)
 * - /api/totem/event-config (totem runtime event/AI settings)
 * - /api/totem/print-config (totem runtime print settings)
 */
export function withTotemRoutingGuard(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context: RouteContext): Promise<Response> => {
    const auth = getAuthContext(req);

    // Only enforce for totem sessions
    if (auth.type !== 'totem') {
      return handler(req, context);
    }

    // Extract the pathname
    const pathname = req.nextUrl.pathname;

    // Allowed paths for totem devices (relative to the totem context)
    const allowedPaths = [
      '/api/totem/session', // Get session info
      '/api/totem/checkin', // Perform check-in
      '/api/totem/event-config', // Get active event + AI config
      '/api/totem/print-config', // Get active event print config
    ];

    const isAllowed = allowedPaths.some((path) => pathname === path);

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: 'Forbidden. Totem access is restricted to credentialing endpoints.',
          code: 'TOTEM_ROUTING_RESTRICTED',
        },
        { status: 403 },
      );
    }

    return handler(req, context);
  };
}
