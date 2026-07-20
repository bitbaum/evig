/**
 * Monatsrapport share tokens — an unguessable public link an approver hands to
 * a referring social worker (who cannot log in, and to whom the app cannot
 * reliably email: the sending domain is not SPF/DKIM-authenticated). Mirrors the
 * deliverables `share_token` pattern; keyed by (userId, month) since a running
 * month may have no timecard row yet. Pure data layer — auth lives in callers.
 */

import { randomUUID } from 'crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { reportShares } from '@/db/schema'

/** The active token for a report, or null if it was never shared / was revoked. */
export async function getReportShareToken(userId: string, month: string): Promise<string | null> {
  const [row] = await db
    .select({ token: reportShares.token })
    .from(reportShares)
    .where(and(eq(reportShares.userId, userId), eq(reportShares.month, month), isNull(reportShares.revokedAt)))
    .limit(1)
  return row?.token ?? null
}

/** Idempotent: returns the existing active token or mints (or revives) one. */
export async function ensureReportShareToken(userId: string, month: string, createdBy: string): Promise<string> {
  const existing = await getReportShareToken(userId, month)
  if (existing) return existing
  const token = randomUUID().replace(/-/g, '')
  // A revoked row may still occupy the (userId, month) unique slot — replace it.
  await db
    .insert(reportShares)
    .values({ token, userId, month, createdBy })
    .onConflictDoUpdate({
      target: [reportShares.userId, reportShares.month],
      set: { token, createdBy, revokedAt: null },
    })
  return token
}

/** Resolve a public token to its report identity, or null if unknown/revoked. */
export async function getReportShareByToken(token: string): Promise<{ userId: string; month: string } | null> {
  const [row] = await db
    .select({ userId: reportShares.userId, month: reportShares.month })
    .from(reportShares)
    .where(and(eq(reportShares.token, token), isNull(reportShares.revokedAt)))
    .limit(1)
  return row ?? null
}

/** Kill the link — the token stops resolving immediately. */
export async function revokeReportShare(userId: string, month: string): Promise<void> {
  await db
    .update(reportShares)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(reportShares.userId, userId), eq(reportShares.month, month)))
}
