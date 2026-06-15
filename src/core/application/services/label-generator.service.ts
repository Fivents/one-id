import * as qrcode from 'qrcode';

export interface LabelData {
  eventName: string;
  participantName: string;
  company: string | null;
  jobTitle: string | null;
  qrContent: string;
  accessCodeDisplay: string;
  showQrCode: boolean;
  showAccessCode: boolean;
}

export interface LabelConfig {
  paperWidth: number;
  paperHeight: number;
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  printerDpi: number;
  fontSizeName: number;
  fontSizeMeta: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTimestamp(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export class LabelGeneratorService {
  async generateBadgeHtml(label: LabelData, config: LabelConfig): Promise<string> {
    let qrDataUrl: string | null = null;
    if (label.showQrCode && label.qrContent) {
      qrDataUrl = await qrcode.toDataURL(label.qrContent, {
        width: Math.max(128, Math.round((22 / 25.4) * config.printerDpi)),
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      });
    }

    const formattedDate = formatTimestamp();
    const companyDisplay = label.company || '';
    const jobTitleDisplay = label.jobTitle || '';
    const rightPanelWidth = label.showQrCode ? '58%' : '100%';

    const qrPanel = label.showQrCode && qrDataUrl
      ? `    <div class="left-panel">
      <img src="${qrDataUrl}" alt="QR Code" />
    </div>`
      : '';

    const metaLine = jobTitleDisplay || companyDisplay
      ? escapeHtml(jobTitleDisplay) + (companyDisplay && jobTitleDisplay ? ' • ' : '') + escapeHtml(companyDisplay)
      : '';

    const accessCodeSection = label.showAccessCode
      ? `      <div class="separator"></div>
      <div class="timestamp">${formattedDate}</div>
      <div>
        <span class="access-code-label">Codigo: </span>
        <span class="access-code">${escapeHtml(label.accessCodeDisplay)}</span>
      </div>`
      : `      <div class="separator"></div>
      <div class="timestamp">${formattedDate}</div>`;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=${config.paperWidth}mm, height=${config.paperHeight}mm">
<title></title>
<style>
  @page { size: ${config.paperWidth}mm ${config.paperHeight}mm; margin: 0; }
  @media print {
    html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${config.paperWidth}mm; height: ${config.paperHeight}mm; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    background: #ffffff;
    color: #000000;
    overflow: hidden;
  }
  .badge {
    display: flex;
    width: ${config.paperWidth}mm;
    height: ${config.paperHeight}mm;
  }
  .left-panel {
    width: 42%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4mm;
  }
  .left-panel img {
    width: 100%;
    height: auto;
    max-width: 28mm;
    object-fit: contain;
  }
  .right-panel {
    width: ${rightPanelWidth};
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 3mm 4mm 3mm 0;
  }
  .brand {
    font-size: 6px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #6366f1;
    margin-bottom: 1mm;
  }
  .event-name {
    font-size: 5px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 2mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .participant-name {
    font-size: ${config.fontSizeName}px;
    font-weight: 700;
    color: #000000;
    line-height: 1.2;
    margin-bottom: 1mm;
    word-break: break-word;
  }
  .meta {
    font-size: ${config.fontSizeMeta}px;
    color: #475569;
    line-height: 1.4;
    margin-bottom: 1.5mm;
  }
  .timestamp {
    font-size: 4px;
    color: #94a3b8;
    margin-bottom: 0.5mm;
  }
  .access-code {
    font-size: 5px;
    font-weight: 600;
    color: #6366f1;
    letter-spacing: 0.05em;
  }
  .access-code-label {
    font-size: 3.5px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .separator {
    width: 100%;
    height: 0.3mm;
    background: #e2e8f0;
    margin: 1mm 0;
  }
</style>
</head>
<body>
  <div class="badge">
${qrPanel}
    <div class="right-panel">
      <div class="brand">ONEID</div>
      <div class="event-name">${escapeHtml(label.eventName)}</div>
      <div class="participant-name">${escapeHtml(label.participantName)}</div>
      <div class="meta">${metaLine}</div>
${accessCodeSection}
    </div>
  </div>
</body>
</html>`;
  }
}
