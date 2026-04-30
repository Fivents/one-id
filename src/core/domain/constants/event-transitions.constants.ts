/**
 * Valid event status transitions.
 * This is the source of truth for UI validation.
 */
export const EVENT_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PUBLISHED', 'CANCELED'],
  PUBLISHED: ['ACTIVE', 'CANCELED'],
  ACTIVE: ['COMPLETED', 'CANCELED'],
  COMPLETED: [],
  CANCELED: [],
};

/**
 * Check if a status transition is valid.
 */
export function canTransitionTo(from: string, to: string): boolean {
  return EVENT_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get all valid transitions from a given status.
 * Always includes the current status for the select component.
 */
export function getValidTransitions(currentStatus: string): string[] {
  const transitions = EVENT_TRANSITIONS[currentStatus] ?? [];
  return [currentStatus, ...transitions];
}

/**
 * Check if a status is a final state (no transitions allowed).
 */
export function isFinalStatus(status: string): boolean {
  return (EVENT_TRANSITIONS[status]?.length ?? 0) === 0;
}
