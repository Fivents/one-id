import { NextRequest, NextResponse } from 'next/server';

import { PRINT_ITEM_KEYS, type PrintConfigResponse, type PrintElementsLayout } from '@/core/communication/requests/print-config';
import { withAuth, withTotemAuth, withTotemRoutingGuard } from '@/core/infrastructure/http/middlewares';
import { getTotemAuth } from '@/core/infrastructure/http/types';
import { prisma } from '@/core/infrastructure/prisma-client';
import { Prisma } from '@/generated/prisma/client';

import { resolveActiveTotemEventContextByTotemId } from '../_lib/active-totem-context';

function parseItemsOrder(input: unknown): string[] {
  if (Array.isArray(input)) {
    const parsed = input.filter((item): item is string => typeof item === 'string');
    return parsed.length > 0 ? parsed : [...PRINT_ITEM_KEYS];
  }

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input) as unknown;
      if (Array.isArray(parsed)) {
        const parsedItems = parsed.filter((item): item is string => typeof item === 'string');
        return parsedItems.length > 0 ? parsedItems : [...PRINT_ITEM_KEYS];
      }
    } catch {
      return [...PRINT_ITEM_KEYS];
    }
  }

  return [...PRINT_ITEM_KEYS];
}

function parseElementsLayout(input: unknown): PrintElementsLayout {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  const value = input as Record<string, unknown>;
  const layout: NonNullable<PrintElementsLayout> = {};

  for (const key of PRINT_ITEM_KEYS) {
    const item = value[key];

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue;
    }

    const position = item as Record<string, unknown>;
    const x = Number(position.x);
    const y = Number(position.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }

    layout[key] = {
      x,
      y,
    };
  }

  return Object.keys(layout).length > 0 ? layout : null;
}

function mapPrintConfigToResponse(config: Prisma.PrintConfigGetPayload<Record<string, never>>): PrintConfigResponse {
  return {
    id: config.id,
    paperWidth: config.paperWidth,
    paperHeight: config.paperHeight,
    orientation: config.orientation,
    marginTop: config.marginTop,
    marginRight: config.marginRight,
    marginBottom: config.marginBottom,
    marginLeft: config.marginLeft,
    showFiventsLogo: config.showFiventsLogo,
    fiventsLogoPosition: config.fiventsLogoPosition,
    fiventsLogoSize: config.fiventsLogoSize,
    showOrgLogo: config.showOrgLogo,
    orgLogoPosition: config.orgLogoPosition,
    orgLogoSize: config.orgLogoSize,
    showQrCode: config.showQrCode,
    qrCodePosition: config.qrCodePosition,
    qrCodeSize: config.qrCodeSize,
    qrCodeContent: config.qrCodeContent,
    showName: config.showName,
    namePosition: config.namePosition,
    nameFontSize: config.nameFontSize,
    nameBold: config.nameBold,
    showCompany: config.showCompany,
    companyPosition: config.companyPosition,
    companyFontSize: config.companyFontSize,
    showJobTitle: config.showJobTitle,
    jobTitlePosition: config.jobTitlePosition,
    jobTitleFontSize: config.jobTitleFontSize,
    itemsOrder: parseItemsOrder(config.itemsOrder),
    printerDpi: config.printerDpi,
    printerType: config.printerType,
    printSpeed: config.printSpeed,
    copies: config.copies,
    backgroundColor: config.backgroundColor,
    textColor: config.textColor,
    fontFamily: config.fontFamily,
    elementsLayout: parseElementsLayout(config.elementsLayout),
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
