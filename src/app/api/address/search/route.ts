import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRBAC } from '@/core/infrastructure/http/middlewares';

type NominatimResult = {
  place_id: number | string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    pedestrian?: string;
    footway?: string;
    path?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

function toFiniteNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const GET = withAuth(
  withRBAC(['EVENT_VIEW'], async (req: NextRequest) => {
    try {
      const query = req.nextUrl.searchParams.get('q')?.trim() ?? '';
      const countryCode = req.nextUrl.searchParams.get('countryCode')?.trim().toLowerCase() || 'br';

      if (query.length < 3) {
        return NextResponse.json({ items: [] }, { status: 200 });
      }

      const params = new URLSearchParams({
        q: query,
        format: 'jsonv2',
        addressdetails: '1',
        limit: '8',
        countrycodes: countryCode,
        dedupe: '1',
      });

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Accept-Language': req.headers.get('accept-language') ?? 'pt-BR,pt;q=0.9,en;q=0.8',
          'User-Agent': 'OneID-Fivents/1.0 (support@fivents.com)',
          Referer: req.nextUrl.origin,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        return NextResponse.json({ items: [] }, { status: 200 });
      }

      const raw = (await response.json()) as NominatimResult[];

      const items = raw.map((item) => {
        const address = item.address ?? {};

        return {
          placeId: String(item.place_id),
          formattedAddress: item.display_name,
          street: address.road ?? address.pedestrian ?? address.footway ?? address.path ?? null,
          number: address.house_number ?? null,
          complement: null,
          neighborhood: address.neighbourhood ?? address.suburb ?? address.quarter ?? null,
          city: address.city ?? address.town ?? address.village ?? address.municipality ?? null,
          state: address.state ?? null,
          postalCode: address.postcode ?? null,
          country: address.country ?? null,
          latitude: toFiniteNumber(item.lat),
          longitude: toFiniteNumber(item.lon),
          source: 'nominatim' as const,
        };
      });

      return NextResponse.json({ items }, { status: 200 });
    } catch {
      return NextResponse.json({ items: [] }, { status: 200 });
    }
  }),
);
