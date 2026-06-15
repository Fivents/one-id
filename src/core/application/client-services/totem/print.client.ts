import { getTotemToken } from './totem-client.service';

export interface PrintParticipantData {
  name: string;
  company?: string | null;
  jobTitle?: string | null;
  participantId: string;
  checkInId?: string;
  eventName: string;
  eventId: string;
  accessCode?: string | null;
  qrCodeValue?: string | null;
}

export interface PrintResult {
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface TotemPrintResponse {
  jobId: string;
  token: string;
  html: string;
  paperWidth: number;
  paperHeight: number;
  printerDpi: number;
  copies: number;
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

export async function triggerTotemPrint(
  eventParticipantId: string,
  checkInId?: string,
): Promise<TotemPrintResponse | null> {
  const token = getTotemToken();
  if (!token) {
    console.warn('[PrintService] No totem token available.');
    return null;
  }

  try {
    const response = await fetch('/api/totem/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ eventParticipantId, checkInId }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Print request failed.' }));
      console.warn('[PrintService] Print request failed:', err.error);
      return null;
    }

    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[PrintService] Print request error:', message);
    return null;
  }
}

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
  html: string,
  copies: number,
  printerDpi: number,
  paperWidthMm: number,
  paperHeightMm: number,
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

    const printResult = await bridge.printHtml({
      html,
      copies,
      printerDpi,
      paperWidthMm,
      paperHeightMm,
    });

    if (typeof printResult === 'boolean') {
      return {
        success: printResult,
        timestamp: new Date(),
      };
    }

    return {
      success: printResult.success,
      error: printResult.error,
      timestamp: new Date(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown silent print error';
    console.warn('[PrintService] Silent print failed:', message);

    return {
      success: false,
      error: message,
      timestamp: new Date(),
    };
  }
}

export function printBadgeInIframe(html: string, token: string, timeoutMs = 120_000): void {
  if (typeof window === 'undefined') return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.open(`/api/print/${token}`, '_blank');
      }
    }, 800);
  };

  iframe.srcdoc = html;
  document.body.appendChild(iframe);

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  iframe.addEventListener('afterprint', cleanup);
  setTimeout(cleanup, timeoutMs);
}

export async function fetchPrintConfig(eventId: string): Promise<{ paperWidth: number; paperHeight: number; printerDpi: number; copies: number } | null> {
  const endpoints = [
    `/api/totem/print-config?eventId=${encodeURIComponent(eventId)}`,
    `/api/events/${eventId}/print-config`,
  ];
  const totemToken = getTotemToken();
  const headers = totemToken
    ? { Authorization: `Bearer ${totemToken}` }
    : undefined;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { headers });
      if (!response.ok) continue;
      return await response.json();
    } catch {
      continue;
    }
  }

  console.warn('[PrintService] No print config found for event:', eventId);
  return null;
}

export function logPrintAttempt(eventId: string, participantId: string, result: PrintResult): void {
  const logEntry = {
    timestamp: result.timestamp.toISOString(),
    eventId,
    participantId,
    success: result.success,
    error: result.error,
  };

  console.info('[PrintService] Print attempt:', JSON.stringify(logEntry));
}
