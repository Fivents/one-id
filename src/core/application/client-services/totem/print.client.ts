/**
 * Client-side print service for totem check-in badge printing.
 *
 * This service handles badge printing after successful check-in.
 * It is designed to be resilient - print failures should never
 * affect the check-in itself.
 */

import type { PrintConfigResponse } from '@/core/communication/requests/print-config/print-config.request';

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

/**
 * Generate badge HTML based on print configuration and participant data.
 */
function generateBadgeHtml(config: PrintConfigResponse, participant: PrintParticipantData): string {
  const mmToPx = (mm: number) => Math.round(mm * (config.printerDpi / 25.4));

  const width = mmToPx(config.paperWidth);
  const height = mmToPx(config.paperHeight);
  const margins = {
    top: mmToPx(config.marginTop),
    right: mmToPx(config.marginRight),
    bottom: mmToPx(config.marginBottom),
    left: mmToPx(config.marginLeft),
  };

  const contentWidth = width - margins.left - margins.right;
  const contentHeight = height - margins.top - margins.bottom;

  const items: { type: string; html: string }[] = [];

  for (const itemType of config.itemsOrder) {
    switch (itemType) {
      case 'fiventsLogo':
        if (config.showFiventsLogo) {
          const logoHeight = mmToPx(config.fiventsLogoSize);
          items.push({
            type: 'fiventsLogo',
            html: `<div style="text-align: center; height: ${logoHeight}px;">
              <img src="/images/fivents-logo.png" alt="Fivents" style="max-height: 100%; max-width: 100%; object-fit: contain;" />
            </div>`,
          });
        }
        break;

      case 'orgLogo':
        if (config.showOrgLogo) {
          const logoHeight = mmToPx(config.orgLogoSize);
          items.push({
            type: 'orgLogo',
            html: `<div style="text-align: center; height: ${logoHeight}px;">
              <img src="/api/organizations/current/logo" alt="Organization" style="max-height: 100%; max-width: 100%; object-fit: contain;" onerror="this.style.display='none'" />
            </div>`,
          });
        }
        break;

      case 'name':
        if (config.showName) {
          items.push({
            type: 'name',
            html: `<div style="text-align: center; font-size: ${config.nameFontSize}px; font-weight: ${config.nameBold ? 'bold' : 'normal'}; word-break: break-word;">
              ${escapeHtml(participant.name)}
            </div>`,
          });
        }
        break;

      case 'company':
        if (config.showCompany && participant.company) {
          items.push({
            type: 'company',
            html: `<div style="text-align: center; font-size: ${config.companyFontSize}px;">
              ${escapeHtml(participant.company)}
            </div>`,
          });
        }
        break;

      case 'jobTitle':
        if (config.showJobTitle && participant.jobTitle) {
          items.push({
            type: 'jobTitle',
            html: `<div style="text-align: center; font-size: ${config.jobTitleFontSize}px;">
              ${escapeHtml(participant.jobTitle)}
            </div>`,
          });
        }
        break;

      case 'qrCode':
        if (config.showQrCode) {
          const qrSize = mmToPx(config.qrCodeSize);
          const qrContent = getQrCodeContent(config, participant);
          items.push({
            type: 'qrCode',
            html: `<div style="text-align: center; height: ${qrSize}px; display: flex; justify-content: center; align-items: center;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrContent)}" alt="QR Code" style="max-height: 100%; max-width: 100%;" />
            </div>`,
          });
        }
        break;
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Badge - ${escapeHtml(participant.name)}</title>
  <style>
    @page {
      size: ${config.paperWidth}mm ${config.paperHeight}mm;
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
    body {
      font-family: ${config.fontFamily}, sans-serif;
      background-color: ${config.backgroundColor};
      color: ${config.textColor};
    }
    .badge {
      width: ${width}px;
      height: ${height}px;
      padding: ${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
    }
    .badge-content {
      width: ${contentWidth}px;
      height: ${contentHeight}px;
      display: flex;
      flex-direction: column;
      justify-content: space-evenly;
      gap: 4px;
    }
  </style>
</head>
<body>
  <div class="badge">
    <div class="badge-content">
      ${items.map((item) => item.html).join('\n      ')}
    </div>
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
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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

/**
 * Fetch print configuration for an event.
 * Returns null if no print config is associated or if fetch fails.
 */
export async function fetchPrintConfig(eventId: string): Promise<PrintConfigResponse | null> {
  try {
    const response = await fetch(`/api/events/${eventId}/print-config`);

    if (!response.ok) {
      console.warn('[PrintService] No print config found for event:', eventId);
      return null;
    }

    const data = await response.json();
    return data as PrintConfigResponse;
  } catch (error) {
    console.error('[PrintService] Failed to fetch print config:', error);
    return null;
  }
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

  console.log('[PrintService] Print attempt:', JSON.stringify(logEntry));

  // In a production environment, you might want to send this to an audit endpoint
  // fetch('/api/audit/print', { method: 'POST', body: JSON.stringify(logEntry) }).catch(() => {});
}
