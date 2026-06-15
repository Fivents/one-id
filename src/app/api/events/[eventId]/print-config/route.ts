import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod/v4';

import type { PrintConfigResponse, QrCodeContentOption } from '@/core/communication/requests/print-config';
import { updatePrintConfigRequestSchema } from '@/core/communication/requests/print-config';
import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';
import type { RouteContext } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';

import { getAuthorizedEvent } from '../../_lib/access';

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
  withRBAC(['EVENT_VIEW'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { printConfigId: true },
      });

      if (!event || !event.printConfigId) {
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
      const message = error instanceof Error ? error.message : 'Internal server error.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }),
);

export const PATCH = withAuth(
  withRBAC(['EVENT_UPDATE'], async (req: NextRequest, context: RouteContext) => {
    try {
      const { eventId } = await context.params;

      const eventOrResponse = await getAuthorizedEvent(req, eventId);
      if (eventOrResponse instanceof Response) {
        return eventOrResponse;
      }

      const body = await req.json();
      const data = updatePrintConfigRequestSchema.parse(body);

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { printConfigId: true },
      });

      if (!event) {
        return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
      }

      let printConfigId = event.printConfigId;

      // If no print config exists, create one with provided values (or defaults)
      if (!printConfigId) {
        const newConfig = await prisma.printConfig.create({
          data: {
            paperWidth: data.paperWidth ?? 90,
            paperHeight: data.paperHeight ?? 62,
            orientation: data.orientation ?? 'LANDSCAPE',
            printerDpi: data.printerDpi ?? 300,
            copies: data.copies ?? 1,
            qrCodeContent: data.qrCodeContent ?? 'qr_code_value',
            showQrCode: data.showQrCode ?? true,
            showAccessCode: data.showAccessCode ?? false,
            fontSizeName: data.fontSizeName ?? 13,
            fontSizeMeta: data.fontSizeMeta ?? 9,
          },
        });

        printConfigId = newConfig.id;

        await prisma.event.update({
          where: { id: eventId },
          data: { printConfigId },
        });
      }

      // Update existing print config
      const updateData: Record<string, unknown> = {};
      if (data.paperWidth !== undefined) updateData.paperWidth = data.paperWidth;
      if (data.paperHeight !== undefined) updateData.paperHeight = data.paperHeight;
      if (data.orientation !== undefined) updateData.orientation = data.orientation;
      if (data.printerDpi !== undefined) updateData.printerDpi = data.printerDpi;
      if (data.copies !== undefined) updateData.copies = data.copies;
      if (data.qrCodeContent !== undefined) updateData.qrCodeContent = data.qrCodeContent;
      if (data.showQrCode !== undefined) updateData.showQrCode = data.showQrCode;
      if (data.showAccessCode !== undefined) updateData.showAccessCode = data.showAccessCode;
      if (data.fontSizeName !== undefined) updateData.fontSizeName = data.fontSizeName;
      if (data.fontSizeMeta !== undefined) updateData.fontSizeMeta = data.fontSizeMeta;

      const config = await prisma.printConfig.update({
        where: { id: printConfigId },
        data: updateData,
      });

      return NextResponse.json(mapPrintConfigToResponse(config), { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid payload.' }, { status: 400 });
      }

      const message = error instanceof Error ? error.message : 'Internal server error.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }),
);
