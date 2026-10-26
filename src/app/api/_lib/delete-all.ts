import { NextResponse } from 'next/server';

export class CountMismatchError extends Error {
  constructor(readonly actual: number) {
    super(`Expected count did not match: ${actual}`);
    this.name = 'CountMismatchError';
  }
}

export type DeleteAllResult = { conflict: false; count: number } | { conflict: true; actual: number };

/**
 * Runs a "delete everything matching the list" transaction that must throw CountMismatchError
 * when the affected row count differs from what the user confirmed. The throw rolls the
 * transaction back; this turns it into a result the route can answer with a 409.
 */
export async function deleteAllMatching(run: () => Promise<number>): Promise<DeleteAllResult> {
  try {
    const count = await run();
    return { conflict: false, count };
  } catch (error) {
    if (error instanceof CountMismatchError) {
      return { conflict: true, actual: error.actual };
    }
    throw error;
  }
}

export function countMismatchResponse(actual: number): NextResponse {
  return NextResponse.json(
    { error: 'The list changed since it was confirmed.', code: 'BULK_DELETE_COUNT_MISMATCH', actual },
    { status: 409 },
  );
}
