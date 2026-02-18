/**
 * Printer / Label Service
 *
 * Types and utilities for label configuration and printing.
 * The actual printing is triggered via the browser's print API on the totem,
 * rendering an HTML-based label preview that matches the thermal printer output.
 */

export interface LabelItemPosition {
  x: number; // mm from left
  y: number; // mm from top
  width: number; // mm
  height: number; // mm
  fontSize?: number; // pt (for text items)
  fontWeight?: "normal" | "bold";
  textAlign?: "left" | "center" | "right";
  visible: boolean;
}

export interface LabelConfigData {
  // Paper
  paperWidth: number;
  paperHeight: number;
  orientation: "portrait" | "landscape";

  // Margins (visual guide only — items use absolute positioning)
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;

  // Per-item positions (absolute on the label, in mm)
  items: Record<string, LabelItemPosition>;

  // Items ordering for layering (bottom → top)
  itemsOrder: string[];

  // QR Code content type
  qrCodeContent: "participant_id" | "check_in_url" | "custom";

  // Printer
  printerDpi: number;
  printerType: "thermal" | "inkjet" | "laser";
  printSpeed: number;
  copies: number;

  // Styling
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

export const DEFAULT_LABEL_CONFIG: LabelConfigData = {
  paperWidth: 62,
  paperHeight: 100,
  orientation: "portrait",
  marginTop: 5,
  marginRight: 5,
  marginBottom: 5,
  marginLeft: 5,
  items: {
    fiventsLogo: { x: 11, y: 3, width: 40, height: 12, visible: true },
    orgLogo: { x: 6, y: 18, width: 50, height: 16, visible: true },
    name: { x: 2, y: 38, width: 58, height: 10, fontSize: 16, fontWeight: "bold", textAlign: "center", visible: true },
    company: { x: 2, y: 50, width: 58, height: 8, fontSize: 12, fontWeight: "normal", textAlign: "center", visible: true },
    jobTitle: { x: 2, y: 59, width: 58, height: 8, fontSize: 10, fontWeight: "normal", textAlign: "center", visible: true },
    qrCode: { x: 16, y: 68, width: 30, height: 30, visible: true },
  },
  itemsOrder: ["fiventsLogo", "orgLogo", "name", "company", "jobTitle", "qrCode"],
  qrCodeContent: "participant_id",
  printerDpi: 203,
  printerType: "thermal",
  printSpeed: 3,
  copies: 1,
  backgroundColor: "#ffffff",
  textColor: "#000000",
  fontFamily: "Arial",
};

export type LabelItemDef = {
  key: string;
  labelKey: string; // i18n key
  required: boolean;
  type: "logo" | "text" | "qrcode";
};

export const LABEL_ITEMS: LabelItemDef[] = [
  { key: "fiventsLogo", labelKey: "labelConfig.items.fiventsLogo", required: true, type: "logo" },
  { key: "orgLogo", labelKey: "labelConfig.items.orgLogo", required: false, type: "logo" },
  { key: "name", labelKey: "labelConfig.items.name", required: false, type: "text" },
  { key: "company", labelKey: "labelConfig.items.company", required: false, type: "text" },
  { key: "jobTitle", labelKey: "labelConfig.items.jobTitle", required: false, type: "text" },
  { key: "qrCode", labelKey: "labelConfig.items.qrCode", required: false, type: "qrcode" },
];

export const PAPER_PRESETS = [
  { nameKey: "labelConfig.presets.thermal62x100", width: 62, height: 100 },
  { nameKey: "labelConfig.presets.thermal80x80", width: 80, height: 80 },
  { nameKey: "labelConfig.presets.thermal57x40", width: 57, height: 40 },
  { nameKey: "labelConfig.presets.badge86x54", width: 86, height: 54 },
  { nameKey: "labelConfig.presets.label100x150", width: 100, height: 150 },
] as const;

export const FONT_OPTIONS = [
  "Arial",
  "Helvetica",
  "Roboto",
  "Inter",
  "Open Sans",
  "Montserrat",
] as const;
