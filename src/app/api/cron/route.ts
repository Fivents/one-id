/**
 * Job queue drain endpoint.
 *
 * Invoked by Vercel Cron (and usable by any external scheduler). It deliberately does NOT go
 * through withAuth: there is no user session behind a cron tick. Access is a shared secret.
 */

import { NextRequest, NextResponse } from 'next/server';

import { createHash, timingSafeEqual } from 'node:crypto';

import { env } from '@/core/infrastructure/environment/env';
import { drainJobs, JobQueue } from '@/core/infrastructure/jobs';
import { prisma } from '@/core/infrastructure/prisma-client';
import { Logger } from '@/core/utils/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Budget stays under maxDuration so the drain returns instead of being killed mid-job. */
const DRAIN_BUDGET_MS = 45_000;

/**
 * Hashing both sides first keeps the comparison constant-time regardless of length, which a
 * bare timingSafeEqual cannot do (it throws on a length mismatch, leaking length).
 */
function secretMatches(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();

  return timingSafeEqual(a, b);
}

function extractSecret(req: NextRequest): string | null {
  const header = req.headers.get('x-cron-secret');
  if (header) return header;

  // Vercel Cron sends the secret as a bearer token.
  const authorization = req.headers.get('authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length);
  }

  return null;
}

async function handle(req: NextRequest): Promise<NextResponse> {
  if (!env.CRON_SECRET) {
    Logger.error('CRON_SECRET is not set; refusing to drain the job queue');
    return NextResponse.json({ error: 'Cron is not configured.', code: 'CRON_NOT_CONFIGURED' }, { status: 503 });
  }

  const provided = extractSecret(req);

  if (!provided || !secretMatches(provided, env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized.', code: 'CRON_UNAUTHORIZED' }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const result = await drainJobs({ queue: new JobQueue(prisma), budgetMs: DRAIN_BUDGET_MS });

    return NextResponse.json({ ...result, durationMs: Date.now() - startedAt }, { status: 200 });
  } catch (error) {
    Logger.error('Job drain failed', { error: error instanceof Error ? error.message : String(error) });

    return NextResponse.json({ error: 'Job drain failed.', code: 'CRON_DRAIN_FAILED' }, { status: 500 });
  }
}

export const POST = handle;

// Vercel Cron issues GET. Same handler, same secret.
export const GET = handle;
