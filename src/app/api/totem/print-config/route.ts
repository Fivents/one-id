import { NextRequest, NextResponse } from 'next/server';

import type { PrintConfigResponse, QrCodeContentOption } from '@/core/communication/requests/print-config';
import { withAuth, withTotemAuth, withTotemRoutingGuard } from '@/core/infrastructure/http/middlewares';
import { getTotemAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { resolveActiveTotemEventContextByTotemId } from '../_lib/active-totem-context';

function mapPrintConfigToResponse(config: {
  id: string;
  paperWidth: number;
  paperHeight: number;
  orientation: string;
  printerDpi: number;
  copies: number;
  qrCodeContent: string;
  showQrCode: boolean;
  showAccessCode: boolean;
  fontSizeName: number;
  fontSizeMeta: number;
  createdAt: Date;
  updatedAt: Date;
}): PrintConfigResponse {
  return {
    id: config.id,
    paperWidth: config.paperWidth,
    paperHeight: config.paperHeight,
    orientation: config.orientation as 'PORTRAIT' | 'LANDSCAPE',
    printerDpi: config.printerDpi,
    copies: config.copies,
    qrCodeContent: (config.qrCodeContent as QrCodeContentOption) || 'qr_code_value',
    showQrCode: config.showQrCode,
    showAccessCode: config.showAccessCode,
    fontSizeName: config.fontSizeName,
    fontSizeMeta: config.fontSizeMeta,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}

export const GET = withAuth(
  withTotemAuth(
    withTotemRoutingGuard(async (req: NextRequest) => {
      try {
        const auth = getTotemAuth(req);
        const context = await resolveActiveTotemEventContextByTotemId(auth.totemId);

        if (!context) {
          return NextResponse.json(
            {
              error: 'No active event assigned to this totem.',
              code: 'TOTEM_NO_ACTIVE_EVENT',
            },
            { status: 403 },
          );
        }

        const requestedEventId = req.nextUrl.searchParams.get('eventId');
        if (requestedEventId && requestedEventId !== context.event.id) {
          return NextResponse.json(
            {
              error: 'Forbidden. Totem can only access print config from its active event.',
              code: 'TOTEM_EVENT_MISMATCH',
            },
            { status: 403 },
          );
        }

        const event = await prisma.event.findUnique({
          where: { id: context.event.id },
          select: { printConfigId: true },
        });

        if (!event?.printConfigId) {
          return NextResponse.json({ error: 'Print configuration not found for this event.' }, { status: 404 });
        }

        const config = await prisma.printConfig.findUnique({
          where: { id: event.printConfigId },
        });

        if (!config) {
          return NextResponse.json({ error: 'Print configuration not found.' }, { status: 404 });
        }

        return NextResponse.json(mapPrintConfigToResponse(config), { status: 200 });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }),
  ),
);
