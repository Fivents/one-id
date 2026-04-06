'use client';

import { type PointerEvent as ReactPointerEvent, useMemo, useRef, useState } from 'react';

import { Grip } from 'lucide-react';

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
      return 'Logo Organizacao';
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
      <p className="text-sm font-medium">Editor visual (arraste livre em mm)</p>

      <div className="grid gap-3 md:grid-cols-2">
        {resolvedLayout.items.map((item) => {
          const coords = resolvedLayout.elementsLayout[item.key];
          const bounded = clampToTicket(item.key, coords?.x ?? 0, coords?.y ?? 0);

          return (
            <div
              key={`${item.key}-coords`}
              className={`rounded-lg border p-3 ${selectedItem === item.key ? 'border-primary bg-primary/5' : 'bg-card'}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{itemLabel(item.key)}</span>
                <span className="text-muted-foreground text-xs">mm</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`${item.key}-x`}>
                    X
                  </Label>
                  <Input
                    id={`${item.key}-x`}
                    type="number"
                    step="0.1"
                    min={0}
                    max={bounded.maxX}
                    value={(coords?.x ?? 0).toFixed(2)}
                    onChange={(event) => handleCoordinateChange(item.key, 'x', event.currentTarget.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor={`${item.key}-y`}>
                    Y
                  </Label>
                  <Input
                    id={`${item.key}-y`}
                    type="number"
                    step="0.1"
                    min={0}
                    max={bounded.maxY}
                    value={(coords?.y ?? 0).toFixed(2)}
                    onChange={(event) => handleCoordinateChange(item.key, 'y', event.currentTarget.value)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border p-2">
        <div className="relative flex min-h-[560px] items-center justify-center overflow-auto rounded-md bg-muted/20 p-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(currentColor 0.8px, transparent 0.8px)',
              backgroundSize: '14px 14px',
            }}
          />
          <div
            className="relative"
            style={{
              width: `${resolvedLayout.pageWidthMm}mm`,
              height: `${resolvedLayout.pageHeightMm}mm`,
            }}
          >
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-md border shadow-lg"
              style={{
                width: `${resolvedLayout.pageWidthMm}mm`,
                height: `${resolvedLayout.pageHeightMm}mm`,
                backgroundColor: resolvedLayout.backgroundColor,
                color: resolvedLayout.textColor,
                fontFamily: resolvedLayout.fontFamily,
              }}
              onPointerMove={moveDrag}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
              onPointerLeave={stopDrag}
            >
              {resolvedLayout.items.map((item) => {
                const isSelected = selectedItem === item.key;

                if (item.kind === 'image') {
                  return (
                    <div
                      key={item.key}
                      role="button"
                      tabIndex={0}
                      className={`group absolute cursor-move rounded border bg-background/70 p-0.5 backdrop-blur-[1px] ${
                        isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-slate-300'
                      }`}
                      style={{
                        left: `${item.x}mm`,
                        top: `${item.y}mm`,
                        width: `${item.sizeMm}mm`,
                        height: `${item.sizeMm}mm`,
                        touchAction: 'none',
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
                      <span className="pointer-events-none absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-white opacity-90">
                        <Grip className="h-3 w-3" />
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
                      className={`group absolute cursor-move rounded border px-1 py-0.5 ${
                        isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-slate-300'
                      }`}
                      style={{
                        left: `${item.x}mm`,
                        top: `${item.y}mm`,
                        fontSize: `${item.fontSizePx}px`,
                        fontWeight: item.bold ? 700 : 400,
                        lineHeight: 1.25,
                        maxWidth: `calc(${resolvedLayout.pageWidthMm}mm - 4mm)`,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        touchAction: 'none',
                        backgroundColor: 'hsl(var(--background) / 0.7)',
                        color: resolvedLayout.textColor,
                      }}
                      onPointerDown={(event) => startDrag(item.key, event)}
                    >
                      {item.text}
                      <span className="pointer-events-none absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-white opacity-90">
                        <Grip className="h-3 w-3" />
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
                    className={`group absolute cursor-move rounded border bg-background/70 p-0.5 backdrop-blur-[1px] ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-slate-300'
                    }`}
                    style={{
                      left: `${item.x}mm`,
                      top: `${item.y}mm`,
                      width: `${item.sizeMm}mm`,
                      height: `${item.sizeMm}mm`,
                      touchAction: 'none',
                    }}
                    onPointerDown={(event) => startDrag(item.key, event)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrSrc} alt="QR Code" className="h-full w-full object-contain" draggable={false} />
                    <span className="pointer-events-none absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-white opacity-90">
                      <Grip className="h-3 w-3" />
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
