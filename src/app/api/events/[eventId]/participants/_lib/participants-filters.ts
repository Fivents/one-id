export type ParticipantFilters = {
  search?: string;
  /** Optional, additive filter used by the manual check-in picker; omitted = all participants. */
  checkedIn?: boolean;
};

// Shared by the listing and by "delete all": both must target exactly the same rows,
// or the count the user confirmed would not match what gets deleted.
export function buildParticipantsWhere(eventId: string, { search, checkedIn }: ParticipantFilters = {}) {
  const term = search?.trim() ?? '';

  return {
    eventId,
    deletedAt: null,
    ...(term
      ? {
          OR: [
            { person: { name: { contains: term, mode: 'insensitive' as const } } },
            { person: { email: { contains: term, mode: 'insensitive' as const } } },
            // A slot with no Person is only reachable through its own snapshot.
            { attendeeFullName: { contains: term, mode: 'insensitive' as const } },
            { attendeeEmail: { contains: term, mode: 'insensitive' as const } },
            { attendeeDocument: { contains: term, mode: 'insensitive' as const } },
            { company: { contains: term, mode: 'insensitive' as const } },
            { jobTitle: { contains: term, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(checkedIn === false ? { checkIns: { none: {} } } : {}),
    ...(checkedIn === true ? { checkIns: { some: {} } } : {}),
  };
}
