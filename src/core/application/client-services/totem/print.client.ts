/**
 * Client-side print service for totem check-in badge printing.
 *
 * This service handles badge printing after successful check-in.
 * It is designed to be resilient - print failures should never
 * affect the check-in itself.
 */

import {
  PRINT_ITEM_KEYS,
  type PrintConfigResponse,
  type PrintElementLayout,
  type PrintItemKey,
} from '@/core/communication/requests/print-config/print-config.request';

import { getTotemToken } from './totem-client.service';

export interface PrintParticipantData {
  name: string;
  company?: string | null;
  jobTitle?: string | null;
  participantId: string;
  checkInId: string;
  eventName: string;
  eventId: string;
}

export interface PrintResult {
  success: boolean;
  error?: string;
  timestamp: Date;
}

export type PrintLayoutItem =
  | {
      key: 'fiventsLogo' | 'orgLogo';
      kind: 'image';
      x: number;
      y: number;
      widthMm: number;
      heightMm: number;
      sizeMm: number;
      src: string;
      alt: string;
    }
  | {
      key: 'name' | 'company' | 'jobTitle';
      kind: 'text';
      x: number;
      y: number;
      widthMm: number;
      heightMm: number;
      text: string;
      fontSizePx: number;
      bold: boolean;
    }
  | {
      key: 'qrCode';
      kind: 'qr';
      x: number;
      y: number;
      widthMm: number;
      heightMm: number;
      sizeMm: number;
      content: string;
    };

export interface ResolvedPrintLayout {
  pageWidthMm: number;
  pageHeightMm: number;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  items: PrintLayoutItem[];
  elementsLayout: Record<PrintItemKey, PrintElementLayout>;
}

const CSS_PIXEL_PER_MM = 96 / 25.4;
const TEXT_LINE_HEIGHT = 1.25;
const TEXT_HORIZONTAL_SAFE_PADDING_MM = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function pxToMm(px: number): number {
  return px / CSS_PIXEL_PER_MM;
}

export function getPrintPageSize(config: Pick<PrintConfigResponse, 'orientation' | 'paperWidth' | 'paperHeight'>): {
  pageWidthMm: number;
  pageHeightMm: number;
} {
  const isLandscape = config.orientation === 'LANDSCAPE';

  return {
    pageWidthMm: isLandscape ? config.paperHeight : config.paperWidth,
    pageHeightMm: isLandscape ? config.paperWidth : config.paperHeight,
  };
}

function itemHeightMm(config: PrintConfigResponse, key: PrintItemKey): number {
  switch (key) {
    case 'fiventsLogo':
      return config.fiventsLogoSize;
    case 'orgLogo':
      return config.orgLogoSize;
    case 'qrCode':
      return config.qrCodeSize;
    case 'name':
      return Math.max(6, pxToMm(config.nameFontSize * 1.4));
    case 'company':
      return Math.max(5, pxToMm(config.companyFontSize * 1.4));
    case 'jobTitle':
      return Math.max(5, pxToMm(config.jobTitleFontSize * 1.4));
  }
}

function itemWidthMm(config: PrintConfigResponse, key: PrintItemKey, pageWidthMm: number): number {
  switch (key) {
    case 'fiventsLogo':
      return config.fiventsLogoSize;
    case 'orgLogo':
      return config.orgLogoSize;
    case 'qrCode':
      return config.qrCodeSize;
    case 'name':
    case 'company':
    case 'jobTitle':
      return Math.max(24, pageWidthMm - config.marginLeft - config.marginRight);
  }
}

function getTextForKey(participant: PrintParticipantData, key: 'name' | 'company' | 'jobTitle'): string {
  if (key === 'name') {
    return participant.name;
  }

  if (key === 'company') {
    return participant.company ?? '';
  }

  return participant.jobTitle ?? '';
}

function getTextFontSize(config: PrintConfigResponse, key: 'name' | 'company' | 'jobTitle'): number {
  if (key === 'name') {
    return config.nameFontSize;
  }

  if (key === 'company') {
    return config.companyFontSize;
  }

  return config.jobTitleFontSize;
}

function estimateTextBoundsMm(
  text: string,
  fontSizePx: number,
  pageWidthMm: number,
  fontFamily: string,
): { widthMm: number; heightMm: number } {
  const maxWidthMm = Math.max(8, pageWidthMm - TEXT_HORIZONTAL_SAFE_PADDING_MM);
  const maxWidthPx = maxWidthMm * CSS_PIXEL_PER_MM;
  const normalizedText = text.trim();

  if (!normalizedText) {
    return {
      widthMm: 8,
      heightMm: Math.max(5, pxToMm(fontSizePx * TEXT_LINE_HEIGHT)),
    };
  }

  let measuredWidthPx = normalizedText.length * fontSizePx * 0.52;

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (context) {
      context.font = `${fontSizePx}px ${fontFamily}`;
      measuredWidthPx = context.measureText(normalizedText).width;
    }
  }

  const lineCount = Math.max(1, Math.ceil(measuredWidthPx / maxWidthPx));
  const widthPx = Math.min(maxWidthPx, measuredWidthPx);
  const heightPx = Math.max(fontSizePx * TEXT_LINE_HEIGHT, lineCount * fontSizePx * TEXT_LINE_HEIGHT);

  return {
    widthMm: Math.max(8, pxToMm(widthPx)),
    heightMm: Math.max(5, pxToMm(heightPx)),
  };
}

function getItemBoundsMm(
  config: PrintConfigResponse,
  participant: PrintParticipantData,
  key: PrintItemKey,
  pageWidthMm: number,
): { widthMm: number; heightMm: number } {
  if (key === 'fiventsLogo') {
    return {
      widthMm: config.fiventsLogoSize,
      heightMm: config.fiventsLogoSize,
    };
  }

  if (key === 'orgLogo') {
    return {
      widthMm: config.orgLogoSize,
      heightMm: config.orgLogoSize,
    };
  }

  if (key === 'qrCode') {
    return {
      widthMm: config.qrCodeSize,
      heightMm: config.qrCodeSize,
    };
  }

  const text = getTextForKey(participant, key);
  const fontSize = getTextFontSize(config, key);
  return estimateTextBoundsMm(text, fontSize, pageWidthMm, config.fontFamily);
}

function visibleItemKeys(config: PrintConfigResponse): PrintItemKey[] {
  const enabled = new Set<PrintItemKey>();

  if (config.showFiventsLogo) {
    enabled.add('fiventsLogo');
  }

  if (config.showOrgLogo) {
    enabled.add('orgLogo');
  }

  if (config.showName) {
    enabled.add('name');
  }

  if (config.showCompany) {
    enabled.add('company');
  }

  if (config.showJobTitle) {
    enabled.add('jobTitle');
  }

  if (config.showQrCode) {
    enabled.add('qrCode');
  }

  const ordered = config.itemsOrder.filter((item): item is PrintItemKey =>
    (PRINT_ITEM_KEYS as readonly string[]).includes(item),
  );

  const uniqueOrdered = ordered.filter((item, index) => ordered.indexOf(item) === index);
  const baseOrder = uniqueOrdered.length > 0 ? uniqueOrdered : [...PRINT_ITEM_KEYS];

  return baseOrder.filter((item) => enabled.has(item));
}

export function buildDefaultElementsLayout(
  config: PrintConfigResponse,
  _participant: PrintParticipantData,
): Record<PrintItemKey, PrintElementLayout> {
  const { pageWidthMm, pageHeightMm } = getPrintPageSize(config);
  const keys = visibleItemKeys(config);
  const gapMm = 2;

  const totalHeight = keys.reduce((acc, key) => acc + itemHeightMm(config, key), 0) + Math.max(0, keys.length - 1) * gapMm;

  const printableTop = config.marginTop;
  const printableHeight = Math.max(0, pageHeightMm - config.marginTop - config.marginBottom);
  let currentY = printableTop + Math.max((printableHeight - totalHeight) / 2, 0);

  const layout: Record<PrintItemKey, PrintElementLayout> = {
    fiventsLogo: { x: 0, y: 0 },
    orgLogo: { x: 0, y: 0 },
    name: { x: 0, y: 0 },
    company: { x: 0, y: 0 },
    jobTitle: { x: 0, y: 0 },
    qrCode: { x: 0, y: 0 },
  };

  for (const key of keys) {
    const widthMm = itemWidthMm(config, key, pageWidthMm);
    const x = key === 'name' || key === 'company' || key === 'jobTitle'
      ? config.marginLeft
      : Math.max((pageWidthMm - widthMm) / 2, 0);

    layout[key] = {
      x,
      y: currentY,
    };

    currentY += itemHeightMm(config, key) + gapMm;
  }

  return layout;
}

function normalizeElementsLayout(
  config: PrintConfigResponse,
  participant: PrintParticipantData,
): Record<PrintItemKey, PrintElementLayout> {
  const { pageWidthMm, pageHeightMm } = getPrintPageSize(config);
  const base = buildDefaultElementsLayout(config, participant);

  const inputLayout = config.elementsLayout;
  if (!inputLayout || typeof inputLayout !== 'object') {
    return base;
  }

  const patched = { ...base };
  const incoming = inputLayout as Partial<Record<PrintItemKey, { x?: unknown; y?: unknown }>>;

  for (const key of PRINT_ITEM_KEYS) {
    const candidate = incoming[key];
    if (!candidate) {
      continue;
    }

    const x = Number(candidate.x);
    const y = Number(candidate.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }

    const bounds = getItemBoundsMm(config, participant, key, pageWidthMm);
    const maxX = Math.max(0, pageWidthMm - bounds.widthMm);
    const maxY = Math.max(0, pageHeightMm - bounds.heightMm);

    patched[key] = {
      x: clamp(x, 0, maxX),
      y: clamp(y, 0, maxY),
    };
  }

  return patched;
}

export function resolvePrintLayout(config: PrintConfigResponse, participant: PrintParticipantData): ResolvedPrintLayout {
  const { pageWidthMm, pageHeightMm } = getPrintPageSize(config);
  const layout = normalizeElementsLayout(config, participant);
  const keys = visibleItemKeys(config);

  const items: PrintLayoutItem[] = [];

  for (const key of keys) {
    const coords = layout[key];
    const bounds = getItemBoundsMm(config, participant, key, pageWidthMm);

    if (!coords) {
      continue;
    }

    if (key === 'fiventsLogo') {
      items.push({
        key,
        kind: 'image',
        x: coords.x,
        y: coords.y,
        widthMm: bounds.widthMm,
        heightMm: bounds.heightMm,
        sizeMm: config.fiventsLogoSize,
        src: '/png/logo-blue.png',
        alt: 'Fivents',
      });
      continue;
    }

    if (key === 'orgLogo') {
      items.push({
        key,
        kind: 'image',
        x: coords.x,
        y: coords.y,
        widthMm: bounds.widthMm,
        heightMm: bounds.heightMm,
        sizeMm: config.orgLogoSize,
        src: '/api/organizations/current/logo',
        alt: 'Organization',
      });
      continue;
    }

    if (key === 'name') {
      items.push({
        key,
        kind: 'text',
        x: coords.x,
        y: coords.y,
        widthMm: bounds.widthMm,
        heightMm: bounds.heightMm,
        text: participant.name,
        fontSizePx: config.nameFontSize,
        bold: config.nameBold,
      });
      continue;
    }

    if (key === 'company') {
      items.push({
        key,
        kind: 'text',
        x: coords.x,
        y: coords.y,
        widthMm: bounds.widthMm,
        heightMm: bounds.heightMm,
        text: participant.company ?? '',
        fontSizePx: config.companyFontSize,
        bold: false,
      });
      continue;
    }

    if (key === 'jobTitle') {
      items.push({
        key,
        kind: 'text',
        x: coords.x,
        y: coords.y,
        widthMm: bounds.widthMm,
        heightMm: bounds.heightMm,
        text: participant.jobTitle ?? '',
        fontSizePx: config.jobTitleFontSize,
        bold: false,
      });
      continue;
    }

    if (key === 'qrCode') {
      items.push({
        key,
        kind: 'qr',
        x: coords.x,
        y: coords.y,
        widthMm: bounds.widthMm,
        heightMm: bounds.heightMm,
        sizeMm: config.qrCodeSize,
        content: getQrCodeContent(config, participant),
      });
    }
  }

  return {
    pageWidthMm,
    pageHeightMm,
    backgroundColor: config.backgroundColor,
    textColor: config.textColor,
    fontFamily: config.fontFamily,
    items,
    elementsLayout: layout,
  };
}

/**
 * Generate badge HTML based on print configuration and participant data.
 */
export function generateBadgeHtml(config: PrintConfigResponse, participant: PrintParticipantData): string {
  const layout = resolvePrintLayout(config, participant);
  const qrPixelSize = (sizeMm: number) => Math.max(128, Math.round((sizeMm / 25.4) * config.printerDpi));

  const itemsHtml = layout.items
    .map((item) => {
      if (item.kind === 'image') {
        const hideOnError = item.key === 'orgLogo' ? " onerror=\"this.style.display='none'\"" : '';

        return `<div class="badge-item badge-image" style="left: ${item.x}mm; top: ${item.y}mm; width: ${item.sizeMm}mm; height: ${item.sizeMm}mm;">
          <img src="${item.src}" alt="${escapeHtml(item.alt)}" style="max-width: 100%; max-height: 100%; object-fit: contain;"${hideOnError} />
        </div>`;
      }

      if (item.kind === 'text') {
        return `<div class="badge-item badge-text" style="left: ${item.x}mm; top: ${item.y}mm; font-size: ${item.fontSizePx}px; font-weight: ${item.bold ? '700' : '400'};">
          ${escapeHtml(item.text)}
        </div>`;
      }

      const qrSizePx = qrPixelSize(item.sizeMm);
      return `<div class="badge-item badge-qr" style="left: ${item.x}mm; top: ${item.y}mm; width: ${item.sizeMm}mm; height: ${item.sizeMm}mm;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=${qrSizePx}x${qrSizePx}&data=${encodeURIComponent(item.content)}" alt="QR Code" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
      </div>`;
    })
    .join('\n      ');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Badge - ${escapeHtml(participant.name)}</title>
  <style>
    @page {
      size: ${layout.pageWidthMm}mm ${layout.pageHeightMm}mm;
      margin: 0;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html,
    body {
      width: ${layout.pageWidthMm}mm;
      height: ${layout.pageHeightMm}mm;
    }
    body {
      font-family: ${layout.fontFamily}, sans-serif;
      background-color: ${layout.backgroundColor};
      color: ${layout.textColor};
      overflow: hidden;
    }
    .badge {
      position: relative;
      width: ${layout.pageWidthMm}mm;
      height: ${layout.pageHeightMm}mm;
      overflow: hidden;
    }
    .badge-item {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${layout.textColor};
    }
    .badge-text {
      max-width: calc(${layout.pageWidthMm}mm - 4mm);
      line-height: 1.25;
      white-space: pre-wrap;
      word-break: break-word;
      justify-content: flex-start;
      align-items: flex-start;
    }
  </style>
</head>
<body>
  <div class="badge">
      ${itemsHtml}
  </div>
</body>
</html>`;
}

/**
 * Get QR code content based on configuration.
 */
function getQrCodeContent(config: PrintConfigResponse, participant: PrintParticipantData): string {
  switch (config.qrCodeContent) {
    case 'participant_id':
      return participant.participantId;
    case 'check_in_url':
      return `${window.location.origin}/checkin/${participant.checkInId}`;
    case 'custom':
    default:
      return participant.participantId;
  }
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Print a badge using the browser print dialog.
 * Opens a hidden iframe, renders the badge, and triggers print.
 */
export async function printBadge(config: PrintConfigResponse, participant: PrintParticipantData): Promise<PrintResult> {
  try {
    const html = generateBadgeHtml(config, participant);

    // Create hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Could not access iframe document');
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for images to load
    await new Promise<void>((resolve) => {
      const images = iframeDoc.querySelectorAll('img');
      if (images.length === 0) {
        resolve();
        return;
      }

      let loadedCount = 0;
      const checkComplete = () => {
        loadedCount++;
        if (loadedCount >= images.length) {
          resolve();
        }
      };

      images.forEach((img) => {
        if (img.complete) {
          checkComplete();
        } else {
          img.onload = checkComplete;
          img.onerror = checkComplete; // Don't block on failed images
        }
      });

      // Timeout after 3 seconds regardless
      setTimeout(resolve, 3000);
    });

    // Trigger print
    iframe.contentWindow?.print();

    // Clean up after a delay to ensure print dialog has started
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);

    return {
      success: true,
      timestamp: new Date(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown print error';
    console.error('[PrintService] Print failed:', message);

    return {
      success: false,
      error: message,
      timestamp: new Date(),
    };
  }
}

type SilentPrintPayload = {
  html: string;
  copies?: number;
  printerDpi?: number;
  paperWidthMm?: number;
  paperHeightMm?: number;
};

type SilentPrintResult = {
  success: boolean;
  error?: string;
};

type SilentPrinterBridge = {
  isAvailable?: () => boolean | Promise<boolean>;
  isPrinterConnected?: () => boolean | Promise<boolean>;
  printHtml?: (payload: SilentPrintPayload) => SilentPrintResult | boolean | Promise<SilentPrintResult | boolean>;
};

export type SilentPrinterAvailability = {
  available: boolean;
  message?: string;
};

function getSilentPrinterBridge(): SilentPrinterBridge | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const candidates = [
    (window as Window & { oneIdPrinter?: SilentPrinterBridge }).oneIdPrinter,
    (window as Window & { OneIDPrinter?: SilentPrinterBridge }).OneIDPrinter,
    (window as Window & { androidPrinter?: SilentPrinterBridge }).androidPrinter,
  ];

  for (const candidate of candidates) {
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

export async function getSilentPrinterAvailability(): Promise<SilentPrinterAvailability> {
  const bridge = getSilentPrinterBridge();

  if (!bridge) {
    return {
      available: false,
      message: 'Integracao de impressao silenciosa nao encontrada neste dispositivo.',
    };
  }

  if (bridge.isAvailable) {
    const isAvailable = await bridge.isAvailable();
    if (!isAvailable) {
      return {
        available: false,
        message: 'Servico de impressao silenciosa indisponivel no momento.',
      };
    }
  }

  if (bridge.isPrinterConnected) {
    const isPrinterConnected = await bridge.isPrinterConnected();
    if (!isPrinterConnected) {
      return {
        available: false,
        message: 'Nenhuma impressora conectada.',
      };
    }
  }

  if (!bridge.printHtml) {
    return {
      available: false,
      message: 'Metodo de impressao silenciosa nao suportado neste dispositivo.',
    };
  }

  return { available: true };
}

export async function printBadgeSilently(
  config: PrintConfigResponse,
  participant: PrintParticipantData,
): Promise<PrintResult> {
  try {
    const availability = await getSilentPrinterAvailability();
    if (!availability.available) {
      return {
        success: false,
        error: availability.message,
        timestamp: new Date(),
      };
    }

    const bridge = getSilentPrinterBridge();
    if (!bridge?.printHtml) {
      return {
        success: false,
        error: 'Metodo de impressao silenciosa indisponivel.',
        timestamp: new Date(),
      };
    }

    const html = generateBadgeHtml(config, participant);
    const printResult = await bridge.printHtml({
      html,
      copies: config.copies,
      printerDpi: config.printerDpi,
      paperWidthMm: config.paperWidth,
      paperHeightMm: config.paperHeight,
    });

    if (typeof printResult === 'boolean') {
      if (!printResult) {
        return {
          success: false,
          error: 'A impressao foi recusada pelo dispositivo.',
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        timestamp: new Date(),
      };
    }

    if (!printResult.success) {
      return {
        success: false,
        error: printResult.error || 'Falha na impressao silenciosa.',
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      timestamp: new Date(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown silent print error';
    console.error('[PrintService] Silent print failed:', message);

    return {
      success: false,
      error: message,
      timestamp: new Date(),
    };
  }
}

/**
 * Fetch print configuration for an event.
 * Returns null if no print config is associated or if fetch fails.
 */
export async function fetchPrintConfig(eventId: string): Promise<PrintConfigResponse | null> {
  const endpoints = [`/api/totem/print-config?eventId=${encodeURIComponent(eventId)}`, `/api/events/${eventId}/print-config`];
  const totemToken = getTotemToken();
  const headers = totemToken
    ? {
        Authorization: `Bearer ${totemToken}`,
      }
    : undefined;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers,
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      return data as PrintConfigResponse;
    } catch {
      continue;
    }
  }

  console.warn('[PrintService] No print config found for event:', eventId);
  return null;
}

/**
 * Log print attempt for audit purposes.
 */
export function logPrintAttempt(eventId: string, participantId: string, result: PrintResult): void {
  const logEntry = {
    timestamp: result.timestamp.toISOString(),
    eventId,
    participantId,
    success: result.success,
    error: result.error,
  };

  console.info('[PrintService] Print attempt:', JSON.stringify(logEntry));

  // In a production environment, you might want to send this to an audit endpoint
  // fetch('/api/audit/print', { method: 'POST', body: JSON.stringify(logEntry) }).catch(() => {});
}
