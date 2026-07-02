/**
 * GET /api/admin/payroll/batches/[id]/export.csv
 *
 * Streams the CSV the accountant plugs into payroll software. Generic
 * shape — one row per person × timecard in the batch. The first
 * column-set is operational (period, person, AHV, canton); the
 * second is the money math (hours, rate, gross). Notes column carries
 * any timecard.notes the staff member left.
 *
 * Super-admin only because the rows expose hourly_rate + AHV + gross
 * pay. Stamps payroll_batches.exported_at + exported_by on success
 * so the UI can show "exported on X".
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiForbidden, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { isSuperAdmin } from '@/lib/permissions'
import { db } from '@/db'
import { payrollBatches, timecards, timecardEntries, teamProfiles, users } from '@/db/schema'
import { eq, sql, and } from 'drizzle-orm'

interface ExportRow {
  person_name: string | null
  person_email: string
  ahv_number: string | null
  canton: string | null
  department: string | null
  employment_type: string | null
  period_start: string
  period_end: string
  hours: number
  hourly_rate_chf: number | null
  gross_chf: number | null
  notes: string | null
  timecard_status: string
}

/** Escape a CSV field per RFC 4180 — wrap in quotes if it contains comma / quote / newline. */
function csvField(value: unknown): string {
  if (value == null) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function rowToCsv(values: unknown[]): string {
  return values.map(csvField).join(',')
}

export const GET = withAdmin<{ id: string }>('payroll', async (
  _request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    if (!isSuperAdmin(session.user.email, session.user.isSuperAdmin)) {
      return apiForbidden('Nur Super-Admins können Lohndaten exportieren.')
    }

    const batchId = context?.params?.id
    if (!batchId) return apiBadRequest('Batch-ID fehlt')

    const [batch] = await db
      .select({
        id: payrollBatches.id,
        periodStart: payrollBatches.periodStart,
        periodEnd: payrollBatches.periodEnd,
      })
      .from(payrollBatches)
      .where(eq(payrollBatches.id, batchId))
      .limit(1)
    if (!batch) return apiNotFound('Lohnlauf')

    // Per-timecard aggregation. Hourly rate comes from
    // timecards.rate_applied_cents (the snapshot taken at close time);
    // fall back to current team_profiles.hourly_rate_cents if the
    // snapshot is somehow null (older batches before mig 080 may be).
    const rows = await db
      .select({
        person_name: users.name,
        person_email: users.email,
        ahv_number: teamProfiles.ahvNumber,
        canton: teamProfiles.cantonTaxCode,
        department: teamProfiles.department,
        employment_type: teamProfiles.employmentType,
        period_start: timecards.periodStart,
        period_end: timecards.periodEnd,
        total_minutes: sql<number>`COALESCE(SUM(${timecardEntries.durationMinutes}), 0)::int`,
        rate_applied_cents: timecards.rateAppliedCents,
        fallback_rate_cents: teamProfiles.hourlyRateCents,
        notes: timecards.notes,
        status: timecards.status,
      })
      .from(timecards)
      .innerJoin(users, eq(timecards.userId, users.id))
      .leftJoin(teamProfiles, eq(teamProfiles.userId, timecards.userId))
      .leftJoin(timecardEntries, eq(timecardEntries.timecardId, timecards.id))
      .where(eq(timecards.payrollBatchId, batchId))
      .groupBy(
        timecards.id,
        users.name,
        users.email,
        teamProfiles.ahvNumber,
        teamProfiles.cantonTaxCode,
        teamProfiles.department,
        teamProfiles.employmentType,
        teamProfiles.hourlyRateCents,
      )

    // Build CSV
    const header = [
      'person_name',
      'person_email',
      'ahv_number',
      'canton',
      'department',
      'employment_type',
      'period_start',
      'period_end',
      'hours',
      'hourly_rate_chf',
      'gross_chf',
      'timecard_status',
      'notes',
    ]
    const lines: string[] = [header.join(',')]

    for (const r of rows) {
      const minutes = Number(r.total_minutes ?? 0)
      const hours = Math.round((minutes / 60) * 100) / 100 // two-decimal hours
      const rateCents = r.rate_applied_cents ?? r.fallback_rate_cents
      const rateChf = rateCents != null ? rateCents / 100 : null
      const grossChf = rateChf != null ? Math.round(hours * rateChf * 100) / 100 : null

      const out: ExportRow = {
        person_name: r.person_name,
        person_email: r.person_email,
        ahv_number: r.ahv_number,
        canton: r.canton,
        department: r.department,
        employment_type: r.employment_type,
        period_start: r.period_start,
        period_end: r.period_end,
        hours,
        hourly_rate_chf: rateChf,
        gross_chf: grossChf,
        timecard_status: r.status,
        notes: r.notes,
      }

      lines.push(rowToCsv([
        out.person_name,
        out.person_email,
        out.ahv_number,
        out.canton,
        out.department,
        out.employment_type,
        out.period_start,
        out.period_end,
        out.hours,
        out.hourly_rate_chf,
        out.gross_chf,
        out.timecard_status,
        out.notes,
      ]))
    }

    // Stamp exported_at / exported_by on first download. The query
    // wraps in a single UPDATE so subsequent downloads only update
    // the timestamp (last-export-wins).
    await db
      .update(payrollBatches)
      .set({
        exportedAt: sql`NOW()`,
        exportedBy: session.user.id,
        updatedAt: sql`NOW()`,
      })
      .where(eq(payrollBatches.id, batchId))

    logger.info('Payroll batch exported', {
      batchId,
      rowCount: rows.length,
      exportedBy: session.user.id,
    })

    const filename = `lohnlauf_${batch.periodStart}_${batch.periodEnd}.csv`
    return new NextResponse(lines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    logger.error('Failed to export payroll batch CSV', { error })
    return apiError(error, 'Export fehlgeschlagen')
  }
})
