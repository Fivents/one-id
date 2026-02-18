"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Printer,
  Eye,
  EyeOff,
  Lock,
  RotateCcw,
  QrCode,
  Type,
  Image as ImageIcon,
  Move,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import {
  DEFAULT_LABEL_CONFIG,
  PAPER_PRESETS,
  FONT_OPTIONS,
  LABEL_ITEMS,
  type LabelConfigData,
  type LabelItemPosition,
} from "@/services/printer";

// Scale factor: mm → px for the canvas preview
const SCALE = 4;

export function LabelConfigTab({
  eventId,
  organizationName,
  initialConfig,
  allowQrCode,
}: {
  eventId: string;
  organizationName: string;
  initialConfig: Record<string, unknown> | null;
  allowQrCode: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [config, setConfig] = useState<LabelConfigData>(() => {
    if (initialConfig) {
      return { ...DEFAULT_LABEL_CONFIG, ...initialConfig } as LabelConfigData;
    }
    return DEFAULT_LABEL_CONFIG;
  });
  const [saving, setSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const update = useCallback(
    <K extends keyof LabelConfigData>(key: K, value: LabelConfigData[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateItem = useCallback(
    (key: string, updates: Partial<LabelItemPosition>) => {
      setConfig((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          [key]: { ...prev.items[key], ...updates },
        },
      }));
    },
    []
  );

  function toggleItemVisibility(key: string) {
    const def = LABEL_ITEMS.find((i) => i.key === key);
    if (def?.required) return;
    if (key === "qrCode" && !allowQrCode) return;
    updateItem(key, { visible: !config.items[key]?.visible });
  }

  function applyPreset(preset: (typeof PAPER_PRESETS)[number]) {
    update("paperWidth", preset.width);
    update("paperHeight", preset.height);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/label-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast.success(t("toast.saved"));
        router.refresh();
      } else {
        toast.error(t("toast.errorOccurred"));
      }
    } catch {
      toast.error(t("toast.errorOccurred"));
    } finally {
      setSaving(false);
    }
  }

  // ─── Drag & Drop ───────────────────────────────────────────
  function handlePointerDown(key: string, e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedItem(key);
    setDragging(key);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const item = config.items[key];
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    dragOffset.current = {
      x: canvasX - item.x * SCALE,
      y: canvasY - item.y * SCALE,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(key: string, e: React.PointerEvent) {
    if (dragging !== key) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    let newX = (canvasX - dragOffset.current.x) / SCALE;
    let newY = (canvasY - dragOffset.current.y) / SCALE;

    // Clamp within paper bounds
    const item = config.items[key];
    newX = Math.max(0, Math.min(config.paperWidth - item.width, newX));
    newY = Math.max(0, Math.min(config.paperHeight - item.height, newY));

    updateItem(key, { x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
  }

  function handlePointerUp(key: string, e: React.PointerEvent) {
    if (dragging === key) {
      setDragging(null);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  }

  // Close selection when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const canvas = canvasRef.current;
      if (canvas && !canvas.contains(e.target as Node)) {
        // Don't deselect if clicking on item settings panel
        const panel = document.getElementById("item-settings-panel");
        if (panel && panel.contains(e.target as Node)) return;
        setSelectedItem(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const previewW = config.paperWidth * SCALE;
  const previewH = config.paperHeight * SCALE;

  const selected = selectedItem ? config.items[selectedItem] : null;
  const selectedDef = selectedItem
    ? LABEL_ITEMS.find((i) => i.key === selectedItem)
    : null;

  const itemIcon = (type: string) => {
    if (type === "logo") return <ImageIcon className="h-3.5 w-3.5" />;
    if (type === "qrcode") return <QrCode className="h-3.5 w-3.5" />;
    return <Type className="h-3.5 w-3.5" />;
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
      {/* Config Panel */}
      <div className="space-y-4">
        {/* Paper Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("labelConfig.paper.title")}</CardTitle>
            <CardDescription>{t("labelConfig.paper.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2 sm:col-span-4">
                <Label>{t("labelConfig.paper.preset")}</Label>
                <Select
                  onValueChange={(v) => {
                    const preset = PAPER_PRESETS.find((p) => p.nameKey === v);
                    if (preset) applyPreset(preset);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("labelConfig.paper.selectSize")} />
                  </SelectTrigger>
                  <SelectContent>
                    {PAPER_PRESETS.map((p) => (
                      <SelectItem key={p.nameKey} value={p.nameKey}>
                        {t(p.nameKey)} ({p.width}×{p.height}mm)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("labelConfig.paper.width")}</Label>
                <Input
                  type="number"
                  min={20}
                  max={200}
                  value={config.paperWidth}
                  onChange={(e) => update("paperWidth", +e.target.value)}
                />
              </div>
              <div>
                <Label>{t("labelConfig.paper.height")}</Label>
                <Input
                  type="number"
                  min={20}
                  max={300}
                  value={config.paperHeight}
                  onChange={(e) => update("paperHeight", +e.target.value)}
                />
              </div>
              <div>
                <Label>{t("labelConfig.paper.orientation")}</Label>
                <Select
                  value={config.orientation}
                  onValueChange={(v) =>
                    update("orientation", v as "portrait" | "landscape")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">{t("labelConfig.paper.portrait")}</SelectItem>
                    <SelectItem value="landscape">{t("labelConfig.paper.landscape")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("labelConfig.paper.font")}</Label>
                <Select
                  value={config.fontFamily}
                  onValueChange={(v) => update("fontFamily", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label>{t("labelConfig.paper.bgColor")}</Label>
                <Input
                  type="color"
                  value={config.backgroundColor}
                  onChange={(e) => update("backgroundColor", e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <Label>{t("labelConfig.paper.textColor")}</Label>
                <Input
                  type="color"
                  value={config.textColor}
                  onChange={(e) => update("textColor", e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("labelConfig.items.title")}</CardTitle>
            <CardDescription>{t("labelConfig.items.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {config.itemsOrder.map((key) => {
                const def = LABEL_ITEMS.find((i) => i.key === key);
                if (!def) return null;
                const item = config.items[key];
                const isVisible = item?.visible && (key !== "qrCode" || allowQrCode);
                const isSelected = selectedItem === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedItem(isSelected ? null : key)}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    {itemIcon(def.type)}
                    <span className="flex-1 text-sm font-medium">{t(def.labelKey)}</span>
                    {def.required ? (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Lock className="h-3 w-3" />
                        {t("labelConfig.items.required")}
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemVisibility(key);
                        }}
                      >
                        {isVisible ? (
                          <>
                            <Eye className="h-3 w-3" /> {t("labelConfig.items.visible")}
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" /> {t("labelConfig.items.hidden")}
                          </>
                        )}
                      </Button>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Item Settings */}
        {selected && selectedItem && selectedDef && (
          <Card id="item-settings-panel">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Move className="h-4 w-4" />
                {t(selectedDef.labelKey)} — {t("labelConfig.position.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label>X (mm)</Label>
                <Input
                  type="number"
                  min={0}
                  max={config.paperWidth}
                  step={0.5}
                  value={selected.x}
                  onChange={(e) => updateItem(selectedItem, { x: +e.target.value })}
                />
              </div>
              <div>
                <Label>Y (mm)</Label>
                <Input
                  type="number"
                  min={0}
                  max={config.paperHeight}
                  step={0.5}
                  value={selected.y}
                  onChange={(e) => updateItem(selectedItem, { y: +e.target.value })}
                />
              </div>
              <div>
                <Label>{t("labelConfig.position.width")}</Label>
                <Input
                  type="number"
                  min={5}
                  max={config.paperWidth}
                  step={0.5}
                  value={selected.width}
                  onChange={(e) => updateItem(selectedItem, { width: +e.target.value })}
                />
              </div>
              <div>
                <Label>{t("labelConfig.position.height")}</Label>
                <Input
                  type="number"
                  min={3}
                  max={config.paperHeight}
                  step={0.5}
                  value={selected.height}
                  onChange={(e) => updateItem(selectedItem, { height: +e.target.value })}
                />
              </div>
              {selectedDef.type === "text" && (
                <>
                  <div>
                    <Label>{t("labelConfig.position.fontSize")}</Label>
                    <Input
                      type="number"
                      min={6}
                      max={48}
                      value={selected.fontSize ?? 12}
                      onChange={(e) => updateItem(selectedItem, { fontSize: +e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t("labelConfig.position.fontWeight")}</Label>
                    <Select
                      value={selected.fontWeight ?? "normal"}
                      onValueChange={(v) =>
                        updateItem(selectedItem, { fontWeight: v as "normal" | "bold" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">{t("labelConfig.position.normal")}</SelectItem>
                        <SelectItem value="bold">{t("labelConfig.position.bold")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("labelConfig.position.textAlign")}</Label>
                    <Select
                      value={selected.textAlign ?? "center"}
                      onValueChange={(v) =>
                        updateItem(selectedItem, { textAlign: v as "left" | "center" | "right" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">{t("labelConfig.position.left")}</SelectItem>
                        <SelectItem value="center">{t("labelConfig.position.center")}</SelectItem>
                        <SelectItem value="right">{t("labelConfig.position.right")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Printer Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Printer className="h-4 w-4" />
              {t("labelConfig.printer.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label>DPI</Label>
              <Select
                value={String(config.printerDpi)}
                onValueChange={(v) => update("printerDpi", +v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="203">203 DPI</SelectItem>
                  <SelectItem value="300">300 DPI</SelectItem>
                  <SelectItem value="600">600 DPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("labelConfig.printer.type")}</Label>
              <Select
                value={config.printerType}
                onValueChange={(v) =>
                  update("printerType", v as LabelConfigData["printerType"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal">{t("labelConfig.printer.thermal")}</SelectItem>
                  <SelectItem value="inkjet">{t("labelConfig.printer.inkjet")}</SelectItem>
                  <SelectItem value="laser">{t("labelConfig.printer.laser")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("labelConfig.printer.speed")}</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={config.printSpeed}
                onChange={(e) => update("printSpeed", +e.target.value)}
              />
            </div>
            <div>
              <Label>{t("labelConfig.printer.copies")}</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={config.copies}
                onChange={(e) => update("copies", +e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? t("common.actions.loading") : t("common.actions.save")}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setConfig(
                initialConfig
                  ? ({ ...DEFAULT_LABEL_CONFIG, ...initialConfig } as LabelConfigData)
                  : DEFAULT_LABEL_CONFIG
              )
            }
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {t("labelConfig.actions.reset")}
          </Button>
        </div>
      </div>

      {/* Live Preview (Canvas) */}
      <div className="xl:sticky xl:top-4 xl:self-start">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("labelConfig.preview.title")}</CardTitle>
            <CardDescription>
              {config.paperWidth}×{config.paperHeight}mm — {t("labelConfig.preview.dragHint")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div
              ref={canvasRef}
              className="relative select-none"
              style={{
                width: previewW,
                height: previewH,
                backgroundColor: config.backgroundColor,
                fontFamily: config.fontFamily,
                border: "2px solid #d1d5db",
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              onClick={() => setSelectedItem(null)}
            >
              {/* Margin guides (dashed) */}
              <div
                className="pointer-events-none absolute border border-dashed border-blue-300/40"
                style={{
                  left: config.marginLeft * SCALE,
                  top: config.marginTop * SCALE,
                  width: (config.paperWidth - config.marginLeft - config.marginRight) * SCALE,
                  height: (config.paperHeight - config.marginTop - config.marginBottom) * SCALE,
                }}
              />

              {/* Render items */}
              {config.itemsOrder.map((key) => {
                const item = config.items[key];
                if (!item?.visible) return null;
                if (key === "qrCode" && !allowQrCode) return null;
                const def = LABEL_ITEMS.find((i) => i.key === key);
                if (!def) return null;
                const isSelected = selectedItem === key;

                const style: React.CSSProperties = {
                  position: "absolute",
                  left: item.x * SCALE,
                  top: item.y * SCALE,
                  width: item.width * SCALE,
                  height: item.height * SCALE,
                  cursor: "move",
                  outline: isSelected
                    ? "2px solid hsl(var(--primary))"
                    : dragging === key
                      ? "2px solid hsl(var(--primary) / 0.5)"
                      : "1px dashed transparent",
                  outlineOffset: 1,
                  borderRadius: 2,
                  transition: dragging === key ? "none" : "outline 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    item.textAlign === "left"
                      ? "flex-start"
                      : item.textAlign === "right"
                        ? "flex-end"
                        : "center",
                  color: config.textColor,
                  zIndex: isSelected ? 20 : 10,
                };

                let content: React.ReactNode = null;

                if (key === "fiventsLogo") {
                  content = (
                    <div
                      className="flex h-full w-full items-center justify-center rounded bg-linear-to-r from-primary/90 to-primary/70"
                      style={{ fontSize: Math.max(8, item.height * SCALE * 0.4) }}
                    >
                      <span className="font-bold tracking-wider text-primary-foreground">
                        FIVENTS
                      </span>
                    </div>
                  );
                } else if (key === "orgLogo") {
                  content = (
                    <div
                      className="flex h-full w-full items-center justify-center rounded border-2 border-dashed border-muted-foreground/30 bg-muted/20"
                      style={{ fontSize: Math.max(7, item.height * SCALE * 0.3) }}
                    >
                      <span className="truncate px-1 text-muted-foreground">
                        {organizationName || "LOGO"}
                      </span>
                    </div>
                  );
                } else if (key === "qrCode") {
                  const s = Math.min(item.width, item.height) * SCALE;
                  content = (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        viewBox="0 0 100 100"
                        width={s * 0.85}
                        height={s * 0.85}
                        className="text-foreground"
                      >
                        {/* Simplified QR code pattern */}
                        <rect x="0" y="0" width="100" height="100" fill="white" stroke="currentColor" strokeWidth="2" />
                        <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                        <rect x="10" y="10" width="15" height="15" fill="white" />
                        <rect x="13" y="13" width="9" height="9" fill="currentColor" />
                        <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                        <rect x="75" y="10" width="15" height="15" fill="white" />
                        <rect x="78" y="13" width="9" height="9" fill="currentColor" />
                        <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                        <rect x="10" y="75" width="15" height="15" fill="white" />
                        <rect x="13" y="78" width="9" height="9" fill="currentColor" />
                        <rect x="35" y="5" width="5" height="5" fill="currentColor" />
                        <rect x="45" y="5" width="5" height="5" fill="currentColor" />
                        <rect x="55" y="5" width="5" height="5" fill="currentColor" />
                        <rect x="35" y="15" width="5" height="5" fill="currentColor" />
                        <rect x="50" y="15" width="5" height="5" fill="currentColor" />
                        <rect x="35" y="35" width="5" height="5" fill="currentColor" />
                        <rect x="45" y="40" width="5" height="5" fill="currentColor" />
                        <rect x="55" y="35" width="5" height="5" fill="currentColor" />
                        <rect x="65" y="45" width="5" height="5" fill="currentColor" />
                        <rect x="75" y="40" width="5" height="5" fill="currentColor" />
                        <rect x="85" y="45" width="5" height="5" fill="currentColor" />
                        <rect x="35" y="55" width="5" height="5" fill="currentColor" />
                        <rect x="50" y="50" width="5" height="5" fill="currentColor" />
                        <rect x="40" y="65" width="5" height="5" fill="currentColor" />
                        <rect x="55" y="60" width="5" height="5" fill="currentColor" />
                        <rect x="70" y="55" width="5" height="5" fill="currentColor" />
                        <rect x="80" y="65" width="5" height="5" fill="currentColor" />
                        <rect x="45" y="75" width="5" height="5" fill="currentColor" />
                        <rect x="60" y="75" width="5" height="5" fill="currentColor" />
                        <rect x="75" y="80" width="5" height="5" fill="currentColor" />
                        <rect x="85" y="70" width="5" height="5" fill="currentColor" />
                        <rect x="55" y="85" width="5" height="5" fill="currentColor" />
                        <rect x="70" y="90" width="5" height="5" fill="currentColor" />
                        <rect x="85" y="85" width="5" height="5" fill="currentColor" />
                      </svg>
                    </div>
                  );
                } else {
                  // Text items: name, company, jobTitle
                  const sampleText: Record<string, string> = {
                    name: "João da Silva",
                    company: "Empresa ABC",
                    jobTitle: "Gerente de TI",
                  };
                  content = (
                    <span
                      className="block w-full truncate px-0.5"
                      style={{
                        fontSize: (item.fontSize ?? 12) * SCALE * 0.22,
                        fontWeight: item.fontWeight === "bold" ? 700 : 400,
                        textAlign: item.textAlign ?? "center",
                        lineHeight: 1.2,
                      }}
                    >
                      {sampleText[key] ?? key}
                    </span>
                  );
                }

                return (
                  <div
                    key={key}
                    role="button"
                    tabIndex={0}
                    style={style}
                    onPointerDown={(e) => handlePointerDown(key, e)}
                    onPointerMove={(e) => handlePointerMove(key, e)}
                    onPointerUp={(e) => handlePointerUp(key, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(key);
                    }}
                    className={`touch-none ${isSelected ? "ring-1 ring-primary/50" : "hover:outline-dashed hover:outline-1 hover:outline-muted-foreground/40"}`}
                  >
                    {content}
                    {isSelected && (
                      <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground">
                        <Move className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
