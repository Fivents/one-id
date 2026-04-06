'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Loader2, MapPin } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type EventAddress, formatEventAddress } from '@/core/domain/value-objects';

interface EventAddressEditorProps {
  address: string;
  addressDetails: EventAddress | null;
  onAddressChange: (value: string) => void;
  onAddressDetailsChange: (value: EventAddress | null) => void;
  idPrefix: string;
  label: string;
  placeholder?: string;
}

interface AddressSearchResponse {
  items: EventAddress[];
}

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function EventAddressEditor({
  address,
  addressDetails,
  onAddressChange,
  onAddressDetailsChange,
  idPrefix,
  label,
  placeholder,
}: EventAddressEditorProps) {
  const [suggestions, setSuggestions] = useState<EventAddress[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const effectiveAddressDetails = useMemo<EventAddress | null>(() => {
    if (addressDetails) {
      return addressDetails;
    }

    const normalized = address.trim();
    if (!normalized) {
      return null;
    }

    return {
      formattedAddress: normalized,
      source: 'manual',
    };
  }, [address, addressDetails]);

  useEffect(() => {
    const query = address.trim();

    if (query.length < 3 || !isSuggestionOpen) {
      setSuggestions([]);
      setIsSearching(false);
      abortRef.current?.abort();
      return;
    }

    const timeout = setTimeout(async () => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      setIsSearching(true);

      try {
        const response = await fetch(`/api/address/search?q=${encodeURIComponent(query)}`, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const payload = (await response.json()) as AddressSearchResponse;
        setSuggestions(Array.isArray(payload.items) ? payload.items : []);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
    };
  }, [address, isSuggestionOpen]);

  function applyAddressPatch(patch: Partial<EventAddress>, forceFormattedAddress?: string) {
    const base: EventAddress = {
      formattedAddress: address.trim(),
      source: 'manual',
      ...effectiveAddressDetails,
    };

    const merged: EventAddress = {
      ...base,
      ...patch,
      source: patch.source ?? 'manual',
      formattedAddress: forceFormattedAddress ?? patch.formattedAddress ?? base.formattedAddress,
    };

    const formattedCandidate = formatEventAddress(merged);
    const formatted = forceFormattedAddress ?? (formattedCandidate || merged.formattedAddress);
    const finalAddress = formatted.trim();

    const normalized: EventAddress = {
      ...merged,
      formattedAddress: finalAddress,
    };

    onAddressDetailsChange(normalized);
    onAddressChange(finalAddress);
  }

  function handleAddressInput(value: string) {
    onAddressChange(value);
    setIsSuggestionOpen(true);

    if (effectiveAddressDetails) {
      onAddressDetailsChange({
        ...effectiveAddressDetails,
        formattedAddress: value,
        source: 'manual',
      });
    }
  }

  function handleSelectSuggestion(suggestion: EventAddress) {
    const selected: EventAddress = {
      ...suggestion,
      formattedAddress: suggestion.formattedAddress,
      source: 'nominatim',
    };

    onAddressChange(selected.formattedAddress);
    onAddressDetailsChange(selected);
    setSuggestions([]);
    setIsSuggestionOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-search`}>{label}</Label>
        <div className="relative">
          <Input
            id={`${idPrefix}-search`}
            value={address}
            onChange={(event) => handleAddressInput(event.currentTarget.value)}
            onFocus={() => setIsSuggestionOpen(true)}
            onBlur={() => {
              window.setTimeout(() => {
                setIsSuggestionOpen(false);
              }, 120);
            }}
            placeholder={placeholder}
            autoComplete="off"
          />

          {isSuggestionOpen && (isSearching || suggestions.length > 0) ? (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-white shadow-lg">
              {isSearching ? (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando enderecos reais...
                </div>
              ) : null}

              {!isSearching
                ? suggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.placeId ?? suggestion.formattedAddress}-${suggestion.latitude ?? 0}`}
                      type="button"
                      className="w-full border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleSelectSuggestion(suggestion);
                      }}
                    >
                      <div className="font-medium text-slate-800">{suggestion.formattedAddress}</div>
                      <div className="text-xs text-slate-500">
                        {suggestion.city ?? 'Cidade desconhecida'}
                        {suggestion.state ? ` - ${suggestion.state}` : ''}
                        {suggestion.country ? `, ${suggestion.country}` : ''}
                      </div>
                    </button>
                  ))
                : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-number`}>Numero</Label>
          <Input
            id={`${idPrefix}-number`}
            value={effectiveAddressDetails?.number ?? ''}
            onChange={(event) =>
              applyAddressPatch({
                number: toNullableString(event.currentTarget.value),
              })
            }
            placeholder="1000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-complement`}>Complemento</Label>
          <Input
            id={`${idPrefix}-complement`}
            value={effectiveAddressDetails?.complement ?? ''}
            onChange={(event) =>
              applyAddressPatch({
                complement: toNullableString(event.currentTarget.value),
              })
            }
            placeholder="Sala, bloco, referencia"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-district`}>Bairro</Label>
          <Input
            id={`${idPrefix}-district`}
            value={effectiveAddressDetails?.neighborhood ?? ''}
            onChange={(event) =>
              applyAddressPatch({
                neighborhood: toNullableString(event.currentTarget.value),
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-postal-code`}>CEP</Label>
          <Input
            id={`${idPrefix}-postal-code`}
            value={effectiveAddressDetails?.postalCode ?? ''}
            onChange={(event) =>
              applyAddressPatch({
                postalCode: toNullableString(event.currentTarget.value),
              })
            }
            placeholder="00000-000"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor={`${idPrefix}-state`}>Estado</Label>
          <Input
            id={`${idPrefix}-state`}
            value={effectiveAddressDetails?.state ?? ''}
            onChange={(event) =>
              applyAddressPatch({
                state: toNullableString(event.currentTarget.value),
              })
            }
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-city`}>Cidade</Label>
          <Input
            id={`${idPrefix}-city`}
            value={effectiveAddressDetails?.city ?? ''}
            onChange={(event) =>
              applyAddressPatch({
                city: toNullableString(event.currentTarget.value),
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-country`}>Pais</Label>
        <Input
          id={`${idPrefix}-country`}
          value={effectiveAddressDetails?.country ?? ''}
          onChange={(event) =>
            applyAddressPatch({
              country: toNullableString(event.currentTarget.value),
            })
          }
        />
      </div>

      {effectiveAddressDetails?.latitude !== null && effectiveAddressDetails?.latitude !== undefined ? (
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <MapPin className="h-4 w-4" />
          Coordenadas: {effectiveAddressDetails.latitude?.toFixed(6)}, {effectiveAddressDetails.longitude?.toFixed(6)}
        </div>
      ) : null}
    </div>
  );
}
