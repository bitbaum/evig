/**
 * GET /api/admin/payroll/batches — list past payroll batches with aggregates.
 *
 * Used by /admin/payroll to render the "previous Lohnläufe" list. Each
 * row shows the period, who closed it + when, exported status, and
 * the count + total hours of linked timecards. Newest first.
 */

import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { payrollBatches, timecards, timecardEntries, users } from '@/db/schema'
import { eq, sql, desc } from 'drizzle-orm'

export const GET = withAdmin('timecards', async (_request: NextRequest, _session: ValidSession) => {
  try {
    const rows = await db
      .select({
        id: payrollBatches.id,
        period_start: payrollBatches.periodStart,
        period_end: payrollBatches.periodEnd,
        closed_at: payrollBatches.closedAt,
        closed_by_id: payrollBatches.closedBy,
        closed_by_name: users.name,
        closed_by_email: users.email,
        exported_at: payrollBatches.exportedAt,
        notes: payrollBatches.notes,
        timecard_count: sql<number>`COUNT(DISTINCT ${timecards.id})::int`,
        total_minutes: sql<number>`COALESCE(SUM(${timecardEntries.durationMinutes}), 0)::int`,
      })
      .from(payrollBatches)
      .leftJoin(users, eq(payrollBatches.closedBy, users.id))
      .leftJoin(timecards, eq(timecards.payrollBatchId, payrollBatches.id))
      .leftJoin(timecardEntries, eq(timecardEntries.timecardId, timecards.id))
      .groupBy(
        payrollBatches.id,
        users.name,
        users.email,
      )
      .orderBy(desc(payrollBatches.periodStart), desc(payrollBatches.createdAt))
      .limit(50)

    return apiSuccess({ items: rows })
  } catch (error) {
    logger.error('Failed to list payroll batches', { error })
    return apiError(error, 'Lohnläufe konnten nicht geladen werden')
  }
})
