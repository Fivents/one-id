import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withSuperAdmin } from '@/core/infrastructure/http/middlewares';
import { prisma } from '@/core/infrastructure/prisma-client';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { assertOrganizationAccess } from '../../events/_lib/access';

// ── GET /api/admin/email-settings ─────────────────────────
// Returns global email settings. API key is redacted.

export const GET = withAuth(
  withSuperAdmin(async (req: NextRequest, context: RouteContext) => {

    const settings = await prisma.emailSettings.findFirst({
      select: {
        id: true,
        fromName: true,
        fromEmail: true,
        replyTo: true,
        apiKey: true,
        updatedAt: true,
      },
    });

    // Determine connection status
    const hasGlobalKey = Boolean(process.env.RESEND_API_KEY);
    const hasOrgKey = Boolean(settings?.apiKey);

    const status: 'configured' | 'global' | 'not_configured' = hasOrgKey
      ? 'configured'
      : hasGlobalKey
        ? 'global'
        : 'not_configured';

    return NextResponse.json({
      settings: settings
        ? {
            id: settings.id,
            fromName: settings.fromName,
            fromEmail: settings.fromEmail,
            replyTo: settings.replyTo,
            // Redact key — only expose whether it exists
            hasApiKey: Boolean(settings.apiKey),
            updatedAt: settings.updatedAt,
          }
        : null,
      status,
      globalFromEmail: process.env.RESEND_FROM_EMAIL ?? null,
      globalFromName: process.env.RESEND_FROM_NAME ?? null,
    });
  }),
);

// ── PATCH /api/admin/email-settings ───────────────────────
// Upserts global email settings. Pass apiKey: "" to clear the override.

export const PATCH = withAuth(
  withSuperAdmin(async (req: NextRequest, context: RouteContext) => {

    const body = await req.json();
    const { apiKey, fromName, fromEmail, replyTo } = body as {
      apiKey?: string;
      fromName?: string;
      fromEmail?: string;
      replyTo?: string;
    };

    const existing = await prisma.emailSettings.findFirst();

    let settings;
    if (existing) {
      settings = await prisma.emailSettings.update({
        where: { id: existing.id },
        data: {
          ...(apiKey !== undefined && { apiKey: apiKey.trim() || null }),
          ...(fromName !== undefined && { fromName: fromName.trim() || 'OneID' }),
          ...(fromEmail !== undefined && { fromEmail: fromEmail.trim() || null }),
          ...(replyTo !== undefined && { replyTo: replyTo.trim() || null }),
        },
        select: { id: true, fromName: true, fromEmail: true, replyTo: true, updatedAt: true },
      });
    } else {
      settings = await prisma.emailSettings.create({
        data: {
          apiKey: apiKey?.trim() || null,
          fromName: fromName?.trim() || 'OneID',
          fromEmail: fromEmail?.trim() || null,
          replyTo: replyTo?.trim() || null,
        },
        select: { id: true, fromName: true, fromEmail: true, replyTo: true, updatedAt: true },
      });
    }

    return NextResponse.json({ settings: { ...settings, hasApiKey: Boolean(apiKey?.trim()) } });
  }),
);
