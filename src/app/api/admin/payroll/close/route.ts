/**
 * POST /api/admin/payroll/close
 *
 * Closes a payroll batch for a date range. Atomically:
 *   1. INSERT INTO payroll_batches (period_start, period_end, closed_at, closed_by)
 *   2. UPDATE every approved timecard whose period falls fully inside
 *      [period_start, period_end] AND has no payroll_batch_id yet —
 *      stamping it with the new batch_id AND snapshotting the current
 *      rate from team_profiles.hourly_rate_cents to
 *      timecards.rate_applied_cents (so a later raise can't retroactively
 *      change historical payroll math).
 *
 * After close the linked timecards remain readable but should be
 * treated as locked by the UI — a future raise / amendment goes
 * through a correction batch, not by editing the row in place.
 *
 * Only super admins can close batches (the operation is financial).
 */

import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiForbidden, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { isSuperAdmin } from '@/lib/permissions'
import { z } from 'zod'
import { db } from '@/db'
import { payrollBatches, timecards, teamProfiles } from '@/db/schema'
import { eq, and, gte, lte, isNull, sql } from 'drizzle-orm'
import { TIMECARD_STATUSES } from '@/config/timecards'

const closeSchema = z.object({
  period_start: z.string().min(1, 'Startdatum erforderlich'),
  period_end: z.string().min(1, 'Enddatum erforderlich'),
  notes: z.string().max(1000).optional().nullable(),
}).refine(d => d.period_end >= d.period_start, {
  message: 'Endperiode darf nicht vor dem Start liegen',
  path: ['period_end'],
})

export const POST = withAdmin('payroll', async (request: NextRequest, session: ValidSession) => {
  try {
    if (!isSuperAdmin(session.user.email, session.user.isSuperAdmin)) {
      return apiForbidden('Nur Super-Admins können einen Lohnlauf abschliessen.')
    }

    const body = await request.json()
    const parsed = closeSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest('Ungültige Eingabedaten', parsed.error.flatten().fieldErrors)
    }

    const { period_start, period_end, notes } = parsed.data

    const result = await db.transaction(async (tx) => {
      // 1. Create the batch shell.
      const [batch] = await tx
        .insert(payrollBatches)
        .values({
          periodStart: period_start,
          periodEnd: period_end,
          closedAt: sql`NOW()`,
          closedBy: session.user.id,
          notes: notes ?? null,
        })
        .returning({ id: payrollBatches.id })

      // 2. Stamp every eligible approved timecard with batch id + rate snapshot.
      //    Drizzle doesn't compose UPDATE ... FROM cleanly across versions,
      //    so use raw SQL — the join + WHERE is straightforward.
      const updated = await tx.execute(sql`
        UPDATE timecards AS t
        SET
          payroll_batch_id = ${batch.id},
          rate_applied_cents = COALESCE(tp.hourly_rate_cents, t.rate_applied_cents),
          updated_at = NOW()
        FROM team_profiles AS tp
        WHERE
          tp.user_id = t.user_id
          AND t.status = ${TIMECARD_STATUSES.APPROVED}
          AND t.payroll_batch_id IS NULL
          AND t.period_start >= ${period_start}
          AND t.period_end <= ${period_end}
        RETURNING t.id
      `)

      const linkedCount = updated.rows.length
      return { batchId: batch.id, linkedCount }
    })

    logger.info('Payroll batch closed', {
      batchId: result.batchId,
      linkedTimecards: result.linkedCount,
      period: `${period_start}..${period_end}`,
      closedBy: session.user.id,
    })

    return apiSuccess(result, 201)
  } catch (error) {
    logger.error('Failed to close payroll batch', { error })
    return apiError(error, 'Lohnlauf konnte nicht abgeschlossen werden')
  }
})

export const GET = withAdmin('payroll', async (_request: NextRequest, _session: ValidSession) => {
  // Helper for the UI: "what's eligible to be closed?" — sums hours of
  // approved timecards still waiting on a batch. Two args via query:
  // ?period_start=YYYY-MM-DD&period_end=YYYY-MM-DD. Returns counts + minutes.
  try {
    const url = new URL(_request.url)
    const period_start = url.searchParams.get('period_start') || ''
    const period_end = url.searchParams.get('period_end') || ''

    if (!period_start || !period_end) {
      return apiBadRequest('period_start und period_end sind erforderlich')
    }

    const [agg] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${timecards.id})::int`,
        minutes: sql<number>`COALESCE(SUM(t_total.total), 0)::int`,
      })
      .from(timecards)
      .leftJoin(
        sql`(
          SELECT timecard_id, SUM(duration_minutes) AS total
          FROM timecard_entries
          GROUP BY timecard_id
        ) AS t_total`,
        sql`t_total.timecard_id = ${timecards.id}`,
      )
      .where(
        and(
          eq(timecards.status, TIMECARD_STATUSES.APPROVED),
          isNull(timecards.payrollBatchId),
          gte(timecards.periodStart, period_start),
          lte(timecards.periodEnd, period_end),
        ),
      )

    return apiSuccess({
      pending_count: Number(agg?.count ?? 0),
      pending_minutes: Number(agg?.minutes ?? 0),
    })
  } catch (error) {
    logger.error('Failed to preview payroll batch', { error })
    return apiError(error, 'Vorschau konnte nicht erstellt werden')
  }
})
