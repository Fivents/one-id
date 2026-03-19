import { z } from 'zod/v4';

const METHOD_VALUES = ['FACE_RECOGNITION', 'QR_CODE', 'MANUAL'] as const;
const SOURCE_VALUES = ['TOTEM', 'APP'] as const;

export type CheckInMethodFilter = (typeof METHOD_VALUES)[number];
export type CheckInSourceFilter = (typeof SOURCE_VALUES)[number];

export type ParsedCheckInFilters = {
  search: string;
  method?: CheckInMethodFilter;
  source?: CheckInSourceFilter;
  totemId?: string;
  from?: Date;
  to?: Date;
  confidenceMin?: number;
  confidenceMax?: number;
  pageSize: number;
  cursor?: string;
};

const filtersSchema = z.object({
  search: z.string().optional(),
  method: z.enum(METHOD_VALUES).optional(),
  source: z.enum(SOURCE_VALUES).optional(),
  totemId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  confidenceMin: z.coerce.number().min(0).max(1).optional(),
  confidenceMax: z.coerce.number().min(0).max(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
});

export function parseCheckInFilters(searchParams: URLSearchParams): ParsedCheckInFilters {
  const parsed = filtersSchema.parse({
    search: searchParams.get('search') ?? undefined,
    method: searchParams.get('method') ?? undefined,
    source: searchParams.get('source') ?? undefined,
    totemId: searchParams.get('totemId') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    confidenceMin: searchParams.get('confidenceMin') ?? undefined,
    confidenceMax: searchParams.get('confidenceMax') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    cursor: searchParams.get('cursor') ?? undefined,
  });

  if (
    parsed.confidenceMin !== undefined &&
    parsed.confidenceMax !== undefined &&
    parsed.confidenceMin > parsed.confidenceMax
  ) {
    throw new Error('confidenceMin cannot be greater than confidenceMax.');
  }

  return {
    search: parsed.search?.trim() ?? '',
    method: parsed.method,
    source: parsed.source,
    totemId: parsed.totemId?.trim() || undefined,
    from: parsed.from ? new Date(parsed.from) : undefined,
    to: parsed.to ? new Date(parsed.to) : undefined,
    confidenceMin: parsed.confidenceMin,
    confidenceMax: parsed.confidenceMax,
    pageSize: parsed.pageSize,
    cursor: parsed.cursor,
  };
}

export function buildCheckInWhere(eventId: string, filters: ParsedCheckInFilters) {
  return {
    eventParticipant: {
      eventId,
      deletedAt: null,
      person: {
        deletedAt: null,
      },
    },
    ...(filters.search
      ? {
          OR: [
            {
              eventParticipant: {
                person: {
                  name: { contains: filters.search, mode: 'insensitive' as const },
                },
              },
            },
            {
              eventParticipant: {
                person: {
                  email: { contains: filters.search, mode: 'insensitive' as const },
                },
              },
            },
          ],
        }
      : {}),
    ...(filters.method ? { method: filters.method } : {}),
    ...(filters.source === 'TOTEM' ? { totemEventSubscriptionId: { not: null } } : {}),
    ...(filters.source === 'APP' ? { totemEventSubscriptionId: null } : {}),
    ...(filters.totemId
      ? {
          totemEventSubscription: {
            totemOrganizationSubscription: {
              totemId: filters.totemId,
            },
          },
        }
      : {}),
    ...(filters.from || filters.to
      ? {
          checkedInAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
    ...(filters.confidenceMin !== undefined || filters.confidenceMax !== undefined
      ? {
          confidence: {
            ...(filters.confidenceMin !== undefined ? { gte: filters.confidenceMin } : {}),
            ...(filters.confidenceMax !== undefined ? { lte: filters.confidenceMax } : {}),
          },
        }
      : {}),
  };
}
