export interface EventAddress {
  formattedAddress: string;
  placeId?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  source?: 'nominatim' | 'manual';
}

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

export function normalizeEventAddress(value: unknown): EventAddress | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const input = value as Record<string, unknown>;
  const formattedAddress = cleanString(input.formattedAddress) ?? '';

  const normalized: EventAddress = {
    formattedAddress,
    placeId: cleanString(input.placeId),
    street: cleanString(input.street),
    number: cleanString(input.number),
    complement: cleanString(input.complement),
    neighborhood: cleanString(input.neighborhood),
    city: cleanString(input.city),
    state: cleanString(input.state),
    postalCode: cleanString(input.postalCode),
    country: cleanString(input.country),
    latitude: cleanNumber(input.latitude),
    longitude: cleanNumber(input.longitude),
    source: input.source === 'nominatim' || input.source === 'manual' ? input.source : 'manual',
  };

  if (!normalized.formattedAddress) {
    normalized.formattedAddress = formatEventAddress(normalized);
  }

  if (!normalized.formattedAddress) {
    return null;
  }

  return normalized;
}

export function formatEventAddress(address: Partial<EventAddress> | null | undefined): string {
  if (!address) {
    return '';
  }

  const street = [cleanString(address.street), cleanString(address.number)].filter(Boolean).join(', ');
  const district = cleanString(address.neighborhood);

  const cityState = [cleanString(address.city), cleanString(address.state)].filter(Boolean).join(' - ');

  const postalCode = cleanString(address.postalCode);
  const country = cleanString(address.country);

  return [street, district, cityState, postalCode, country].filter(Boolean).join(', ');
}
