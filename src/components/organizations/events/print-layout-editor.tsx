'use client';

import { type PointerEvent as ReactPointerEvent, useMemo, useRef, useState } from 'react';

import { GripVertical, Maximize2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type PrintParticipantData, resolvePrintLayout } from '@/core/application/client-services/totem/print.client';
import type { PrintConfigResponse, PrintElementLayout, PrintItemKey } from '@/core/communication/requests/print-config';

interface PrintLayoutEditorProps {
  config: PrintConfigResponse;
  participant: PrintParticipantData;
  onLayoutChange: (layout: Record<PrintItemKey, PrintElementLayout>) => void;
}

function itemLabel(key: PrintItemKey): string {
  switch (key) {
    case 'fiventsLogo':
      return 'Logo Fivents';
    case 'orgLogo':
      return 'Logo Org.';
    case 'name':
      return 'Nome';
    case 'company':
      return 'Empresa';
    case 'jobTitle':
      return 'Cargo';
    case 'qrCode':
      return 'QR Code';
  }
}

function itemColor(key: PrintItemKey): string {
  switch (key) {
    case 'fiventsLogo':
      return '#3b82f6';
    case 'orgLogo':
      return '#8b5cf6';
    case 'name':
      return '#059669';
    case 'company':
      return '#d97706';
    case 'jobTitle':
      return '#dc2626';
    case 'qrCode':
      return '#0891b2';
  }
}

function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function PrintLayoutEditor({ config, participant, onLayoutChange }: PrintLayoutEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    key: PrintItemKey;
    offsetXmm: number;
    offsetYmm: number;
  } | null>(null);

  const [selectedItem, setSelectedItem] = useState<PrintItemKey | null>(null);

  const resolvedLayout = useMemo(() => resolvePrintLayout(config, participant), [config, participant]);
  const itemsByKey = useMemo(() => {
    return new Map(resolvedLayout.items.map((item) => [item.key, item]));
  }, [resolvedLayout.items]);

  // Calculate a scale that fits the preview nicely
  const previewScale = useMemo(() => {
    const maxW = 380;
    const maxH = 560;
    const scaleX = maxW / resolvedLayout.pageWidthMm;
    const scaleY = maxH / resolvedLayout.pageHeightMm;
    return Math.min(scaleX, scaleY, 5);
  }, [resolvedLayout.pageWidthMm, resolvedLayout.pageHeightMm]);

  function clampToTicket(key: PrintItemKey, x: number, y: number) {
    const item = itemsByKey.get(key);
    const maxX = Math.max(0, resolvedLayout.pageWidthMm - (item?.widthMm ?? 0));
    const maxY = Math.max(0, resolvedLayout.pageHeightMm - (item?.heightMm ?? 0));

    return {
      x: roundCoordinate(clamp(x, 0, maxX)),
      y: roundCoordinate(clamp(y, 0, maxY)),
      maxX,
      maxY,
    };
  }

  function updateItemPosition(key: PrintItemKey, x: number, y: number) {
    const clamped = clampToTicket(key, x, y);

    onLayoutChange({
      ...resolvedLayout.elementsLayout,
      [key]: {
        x: clamped.x,
        y: clamped.y,
      },
    });
  }

  function startDrag(key: PrintItemKey, event: ReactPointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const item = itemsByKey.get(key);
    if (!item) {
      return;
    }

    const mmPerPixelX = resolvedLayout.pageWidthMm / rect.width;
    const mmPerPixelY = resolvedLayout.pageHeightMm / rect.height;

    const pointerXmm = (event.clientX - rect.left) * mmPerPixelX;
    const pointerYmm = (event.clientY - rect.top) * mmPerPixelY;

    dragRef.current = {
      key,
      offsetXmm: pointerXmm - item.x,
      offsetYmm: pointerYmm - item.y,
    };

    setSelectedItem(key);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const mmPerPixelX = resolvedLayout.pageWidthMm / rect.width;
    const mmPerPixelY = resolvedLayout.pageHeightMm / rect.height;

    const pointerXmm = (event.clientX - rect.left) * mmPerPixelX;
    const pointerYmm = (event.clientY - rect.top) * mmPerPixelY;

    updateItemPosition(
      dragRef.current.key,
      pointerXmm - dragRef.current.offsetXmm,
      pointerYmm - dragRef.current.offsetYmm,
    );
  }

  function stopDrag() {
    dragRef.current = null;
  }

  function handleCoordinateChange(key: PrintItemKey, axis: 'x' | 'y', rawValue: string) {
    const parsed = Number(rawValue);

    if (!Number.isFinite(parsed)) {
      return;
    }

    const current = resolvedLayout.elementsLayout[key] ?? { x: 0, y: 0 };
    if (axis === 'x') {
      updateItemPosition(key, parsed, current.y);
      return;
    }

    updateItemPosition(key, current.x, parsed);
  }

  return (
    <div className="space-y-4">
      {/* Coordinate inputs */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {resolvedLayout.items.map((item) => {
          const coords = resolvedLayout.elementsLayout[item.key];
          const bounded = clampToTicket(item.key, coords?.x ?? 0, coords?.y ?? 0);
          const color = itemColor(item.key);

          return (
            <div
              key={`${item.key}-coords`}
              className={`rounded-lg border p-2.5 transition-all cursor-pointer ${
                selectedItem === item.key
                  ? 'ring-2 shadow-sm'
                  : 'hover:border-foreground/20'
              }`}
              style={{
                borderColor: selectedItem === item.key ? color : undefined,
                boxShadow: selectedItem === item.key ? `0 0 0 2px ${color}33` : undefined,
              }}
              onClick={() => setSelectedItem(item.key)}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-semibold">{itemLabel(item.key)}</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-muted-foreground" htmlFor={`${item.key}-x`}>
                    X (mm)
                  </Label>
                  <Input
                    id={`${item.key}-x`}
                    type="number"
                    step="0.5"
                    min={0}
                    max={bounded.maxX}
                    value={(coords?.x ?? 0).toFixed(1)}
                    onChange={(event) => handleCoordinateChange(item.key, 'x', event.currentTarget.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-muted-foreground" htmlFor={`${item.key}-y`}>
                    Y (mm)
                  </Label>
                  <Input
                    id={`${item.key}-y`}
                    type="number"
                    step="0.5"
                    min={0}
                    max={bounded.maxY}
                    value={(coords?.y ?? 0).toFixed(1)}
                    onChange={(event) => handleCoordinateChange(item.key, 'y', event.currentTarget.value)}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Realistic badge preview */}
      <div className="rounded-xl border bg-gradient-to-br from-muted/30 via-muted/10 to-muted/30 p-6">
        {/* Size indicator */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Maximize2 className="h-3 w-3" />
            <span>
              {resolvedLayout.pageWidthMm}mm × {resolvedLayout.pageHeightMm}mm
              {config.printerType === 'thermal' && ' · Térmica'}
              {config.printerDpi > 0 && ` · ${config.printerDpi} DPI`}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">Arraste os elementos para reposicionar</span>
        </div>

        <div className="flex items-center justify-center">
          {/* Paper simulation with shadow */}
          <div
            className="relative"
            style={{
              width: `${resolvedLayout.pageWidthMm * previewScale}px`,
              height: `${resolvedLayout.pageHeightMm * previewScale}px`,
            }}
          >
            {/* Paper shadow */}
            <div
              className="absolute inset-0 rounded-sm"
              style={{
                boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
              }}
            />

            {/* The actual label preview */}
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-sm"
              style={{
                width: `${resolvedLayout.pageWidthMm * previewScale}px`,
                height: `${resolvedLayout.pageHeightMm * previewScale}px`,
                backgroundColor: resolvedLayout.backgroundColor,
                color: resolvedLayout.textColor,
                fontFamily: resolvedLayout.fontFamily,
              }}
              onPointerMove={moveDrag}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
              onPointerLeave={stopDrag}
            >
              {/* Event name header bar */}
              <div
                className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden"
                style={{
                  height: `${5.5 * previewScale}px`,
                  backgroundColor: resolvedLayout.textColor,
                  color: resolvedLayout.backgroundColor,
                  fontSize: `${Math.max(6, 7 * previewScale * 0.26)}px`,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  whiteSpace: 'nowrap',
                }}
              >
                {participant.eventName}
              </div>

              {/* Separator line */}
              <div
                className="absolute"
                style={{
                  top: `${5.5 * previewScale}px`,
                  left: `${config.marginLeft * previewScale}px`,
                  right: `${config.marginRight * previewScale}px`,
                  height: `${0.3 * previewScale}px`,
                  backgroundColor: resolvedLayout.textColor,
                  opacity: 0.15,
                }}
              />

              {/* Center guide lines (subtle) */}
              <div
                className="pointer-events-none absolute"
                style={{
                  left: `${(resolvedLayout.pageWidthMm / 2) * previewScale}px`,
                  top: `${6 * previewScale}px`,
                  bottom: 0,
                  width: '1px',
                  borderLeft: '1px dashed',
                  borderColor: 'rgba(0,0,0,0.06)',
                }}
              />

              {/* Render items */}
              {resolvedLayout.items.map((item) => {
                const isSelected = selectedItem === item.key;
                const color = itemColor(item.key);

                if (item.kind === 'image') {
                  return (
                    <div
                      key={item.key}
                      role="button"
                      tabIndex={0}
                      className="group absolute cursor-move"
                      style={{
                        left: `${item.x * previewScale}px`,
                        top: `${item.y * previewScale}px`,
                        width: `${item.sizeMm * previewScale}px`,
                        height: `${item.sizeMm * previewScale}px`,
                        touchAction: 'none',
                        outline: isSelected ? `2px solid ${color}` : '1px dashed rgba(0,0,0,0.15)',
                        outlineOffset: '1px',
                        borderRadius: '2px',
                      }}
                      onPointerDown={(event) => startDrag(item.key, event)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.src}
                        alt={item.alt}
                        className="h-full w-full object-contain"
                        draggable={false}
                        onError={(event) => {
                          if (item.key === 'orgLogo') {
                            event.currentTarget.style.visibility = 'hidden';
                          }
                        }}
                      />
                      <span
                        className="pointer-events-none absolute -top-1.5 -right-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ backgroundColor: color }}
                      >
                        <GripVertical className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  );
                }

                if (item.kind === 'text') {
                  return (
                    <div
                      key={item.key}
                      role="button"
                      tabIndex={0}
                      className="group absolute cursor-move"
                      style={{
                        left: `${item.x * previewScale}px`,
                        top: `${item.y * previewScale}px`,
                        fontSize: `${item.fontSizePx * previewScale * 0.26}px`,
                        fontWeight: item.bold ? 700 : 400,
                        lineHeight: 1.2,
                        maxWidth: `${(resolvedLayout.pageWidthMm - config.marginLeft - config.marginRight) * previewScale}px`,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        touchAction: 'none',
                        color: resolvedLayout.textColor,
                        textAlign: 'center' as const,
                        letterSpacing: item.key === 'name' ? '0.02em' : undefined,
                        textTransform: item.key === 'name' ? 'uppercase' as const : undefined,
                        fontStyle: item.key === 'jobTitle' ? 'italic' : undefined,
                        opacity: item.key === 'jobTitle' ? 0.6 : item.key === 'company' ? 0.8 : 1,
                        outline: isSelected ? `2px solid ${color}` : '1px dashed rgba(0,0,0,0.08)',
                        outlineOffset: '1px',
                        borderRadius: '2px',
                        padding: `${1 * previewScale * 0.3}px ${2 * previewScale * 0.3}px`,
                      }}
                      onPointerDown={(event) => startDrag(item.key, event)}
                    >
                      {item.text}
                      <span
                        className="pointer-events-none absolute -top-1.5 -right-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ backgroundColor: color }}
                      >
                        <GripVertical className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  );
                }

                const qrPixelSize = Math.max(128, Math.round((item.sizeMm / 25.4) * config.printerDpi));
                const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${qrPixelSize}x${qrPixelSize}&data=${encodeURIComponent(item.content)}`;

                return (
                  <div
                    key={item.key}
                    role="button"
                    tabIndex={0}
                    className="group absolute cursor-move"
                    style={{
                      left: `${item.x * previewScale}px`,
                      top: `${item.y * previewScale}px`,
                      width: `${item.sizeMm * previewScale}px`,
                      height: `${item.sizeMm * previewScale}px`,
                      touchAction: 'none',
                      outline: isSelected ? `2px solid ${color}` : '1px dashed rgba(0,0,0,0.15)',
                      outlineOffset: '1px',
                      borderRadius: '2px',
                    }}
                    onPointerDown={(event) => startDrag(item.key, event)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrSrc} alt="QR Code" className="h-full w-full object-contain" draggable={false} />
                    <span
                      className="pointer-events-none absolute -top-1.5 -right-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ backgroundColor: color }}
                    >
                      <GripVertical className="h-2.5 w-2.5" />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
