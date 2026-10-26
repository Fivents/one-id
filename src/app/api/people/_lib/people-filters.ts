export type PeopleFilters = {
  organizationId: string;
  search?: string;
  eventId?: string;
  excludeEventId?: string;
  includeDeleted?: boolean;
};

// Shared by the listing and by "delete all": both must target exactly the same rows,
// or the count the user confirmed would not match what gets deleted.
export function buildPeopleWhere({ organizationId, search, eventId, excludeEventId, includeDeleted }: PeopleFilters) {
  const term = search?.trim() ?? '';

  return {
    organizationId,
    deletedAt: includeDeleted ? { not: null as Date | null } : null,
    ...(term
      ? {
          OR: [
            { name: { contains: term, mode: 'insensitive' as const } },
            { email: { contains: term, mode: 'insensitive' as const } },
            { document: { contains: term, mode: 'insensitive' as const } },
            { phone: { contains: term, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(eventId
      ? {
          eventParticipants: {
            some: {
              eventId,
              deletedAt: null,
            },
          },
        }
      : {}),
    ...(excludeEventId
      ? {
          NOT: {
            eventParticipants: {
              some: {
                eventId: excludeEventId,
                deletedAt: null,
              },
            },
          },
        }
      : {}),
  };
}
