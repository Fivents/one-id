import { NextRequest, NextResponse } from 'next/server';

import { randomBytes } from 'crypto';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedEvent } from '../../_lib/access';

/**
 * GET - Returns the current public link status
 */
export const GET = withAuth(
  withRBAC(['EVENT_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    return NextResponse.json({
      publicSlug: eventOrResponse.publicSlug,
      publicUrl: eventOrResponse.publicSlug
        ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/live/${eventOrResponse.publicSlug}`
        : null,
    });
  }),
);

/**
 * POST - Generates a new public link
 */
export const POST = withAuth(
  withRBAC(['EVENT_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    const publicSlug = generateSecureSlug();

    await prisma.event.update({
      where: { id: eventId },
      data: { publicSlug },
    });

    return NextResponse.json({
      publicSlug,
      publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/live/${publicSlug}`,
    });
  }),
);

/**
 * DELETE - Removes the public link
 */
export const DELETE = withAuth(
  withRBAC(['EVENT_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    const { eventId } = await context.params;

    const eventOrResponse = await getAuthorizedEvent(req, eventId);
    if (eventOrResponse instanceof Response) {
      return eventOrResponse;
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { publicSlug: null },
    });

    return NextResponse.json({ success: true });
  }),
);

/**
 * Generates a secure, URL-friendly slug
 */
function generateSecureSlug(): string {
  return randomBytes(16).toString('base64url');
}
