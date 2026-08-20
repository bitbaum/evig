/**
 * Cron: Auto-release escrow funds past their release deadline
 *
 * GET /api/cron/release-escrow
 *
 * Escrow payments (workshop/appointment with useEscrow=true) are only AUTHORIZED
 * at checkout — the funds are held, not captured. They are normally captured when
 * the buyer releases them (POST /api/payments/escrow/[id]). This cron is the
 * safety net: any escrow still 'active' past its release_deadline is captured so
 * Revamp-IT actually receives the money before the Payrexx reservation expires
 * (~7 days). Protected by CRON_SECRET. Scheduled by
 * revampit-cron@release-escrow.timer.
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { escrowAccounts, paymentTransactions } from '@/db/schema'
import { and, eq, lt, isNotNull, sql } from 'drizzle-orm'
import { captureTransaction } from '@/lib/payments/payrexx-client'
import { ESCROW_STATUS } from '@/config/payment-status'
import { logger } from '@/lib/logger'
import { requireCronAuth } from '@/lib/api/cron-auth'

export async function GET(request: NextRequest) {
  const auth = requireCronAuth(request)
  if (!auth.ok) return auth.response

  try {
    // Active escrows past their deadline, with the gateway transaction to capture.
    const due = await db
      .select({
        escrowId: escrowAccounts.id,
        totalAmountCents: escrowAccounts.totalAmountCents,
        releasedAmountCents: escrowAccounts.releasedAmountCents,
        providerTransactionId: paymentTransactions.providerTransactionId,
      })
      .from(escrowAccounts)
      .innerJoin(paymentTransactions, eq(escrowAccounts.transactionId, paymentTransactions.id))
      .where(
        and(
          eq(escrowAccounts.status, ESCROW_STATUS.ACTIVE),
          isNotNull(escrowAccounts.releaseDeadline),
          lt(escrowAccounts.releaseDeadline, sql`NOW()`),
        ),
      )

    let released = 0
    const errors: string[] = []

    for (const e of due) {
      const remaining = e.totalAmountCents - e.releasedAmountCents

      // Nothing left to capture (or no gateway txn) → just close the escrow so it
      // isn't reprocessed every run.
      if (remaining <= 0 || !e.providerTransactionId) {
        await db
          .update(escrowAccounts)
          .set({
            status: ESCROW_STATUS.RELEASED,
            releasedAt: sql`CURRENT_TIMESTAMP`,
            releaseNotes: 'Automatisch freigegeben (Frist abgelaufen, keine Erfassung nötig)',
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(escrowAccounts.id, e.escrowId))
        released++
        continue
      }

      try {
        // Capture FIRST — only mark released if the money is actually collected,
        // so a Payrexx failure leaves the row 'active' for the next run to retry.
        await captureTransaction(e.providerTransactionId, remaining)
        await db
          .update(escrowAccounts)
          .set({
            status: ESCROW_STATUS.RELEASED,
            releasedAmountCents: sql`${escrowAccounts.totalAmountCents}`,
            releasedAt: sql`CURRENT_TIMESTAMP`,
            releaseNotes: 'Automatisch freigegeben (Frist abgelaufen)',
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(escrowAccounts.id, e.escrowId))
        released++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`${e.escrowId}: ${msg}`)
        logger.error('Cron: escrow auto-release capture failed', { escrowId: e.escrowId, error: err })
      }
    }

    logger.info('Cron: release-escrow completed', { found: due.length, released, errors: errors.length })

    return Response.json({
      success: true,
      found: due.length,
      released,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    logger.error('Cron: release-escrow failed', { error })
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
