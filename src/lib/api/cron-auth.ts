import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { logger } from '@/lib/logger';

/**
 * The one place a cron request is authorised.
 *
 * Every cron route used to inline its own version, and five of the six inlined
 * a variant that **fails open** when CRON_SECRET is unset:
 *
 *     if (cronSecret) { ...check... }              // no secret → no check at all
 *     const ok = !cronSecret || headerMatches      // no secret → authorised
 *     if (!cronSecret) return true                 // no secret → authorised
 *
 * Each was written to make local development convenient, and each turns a
 * missing environment variable into an open endpoint. The routes behind this
 * gate close decisions, prune the audit log, wake recurring tasks and — in
 * release-escrow — capture payment transactions and release escrowed funds.
 * "Convenient in dev" is not worth "anyone can release escrow if an env var
 * goes missing".
 *
 * Only `timecard-reminders` got it right, with `if (!cronSecret) return false`.
 * This generalises that one.
 *
 * Local development is still convenient: set CRON_SECRET in .env.local, which
 * scripts/ops/run-cron.sh already reads.
 */

export type CronAuthResult = { ok: true } | { ok: false; response: NextResponse };

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

/** Constant-time compare. Over TLS this is close to unexploitable, so it is not
 *  the point — a helper that is obviously correct removes the need for anyone to
 *  reason about whether it matters here. */
function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch, which would leak the length.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function requireCronAuth(request: Request): CronAuthResult {
  const expected = process.env.CRON_SECRET;

  // Fail closed. An unconfigured secret is a broken deployment, not an open door.
  if (!expected || expected.trim().length === 0) {
    logger.error(
      'CRON_SECRET is not set — refusing every cron request. Set it in the environment; the timers will fail loudly until you do.',
    );
    return { ok: false, response: unauthorized() };
  }

  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return { ok: false, response: unauthorized() };
  }

  return secretsMatch(header.slice('Bearer '.length), expected)
    ? { ok: true }
    : { ok: false, response: unauthorized() };
}
