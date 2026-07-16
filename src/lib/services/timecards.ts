import { db } from '@/db'
import { notifications, teamProfiles, timecards, timecardEntries, users } from '@/db/schema'
import { and, asc, eq, gte, lte, or, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { createNotification, notifyUsers } from '@/lib/services/notifications'
import { logActivity } from '@/lib/activity'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'
import { TIMECARD_STATUSES, type TimecardStatus } from '@/config/timecards'
import {
  buildTimecardEntriesForMonth,
  buildTimecardEntriesFromSchedule,
  getMonthStart,
  getNextMonthStart,
  parseWeeklySchedule,
  type WeeklySchedule,
} from '@/lib/team/schedule'
import { normalizeTimeToHHMM } from '@/lib/team/timecard-utils'
import { formatTimecardPeriodLabel } from '@/lib/team/timecard-period-label'
import { runReviewTransition, type ReviewGuard } from '@/lib/lifecycle/review-workflow'
import type { TransitionTable } from '@/lib/lifecycle'
import type { WorkflowEvent } from '@/lib/lifecycle/dispatch'
import {
  timecardPeriodQuerySchema,
  timecardSaveSchema,
  timecardReviewActionSchema,
  type Timecard,
  type TimecardEntry,
  type TimecardPeriodQuery,
  type TimecardSaveInput,
  type TimecardReviewActionInput,
} from '@/lib/schemas/timecards'
import { getTimecardApproverIds } from '@/lib/team/timecard-approvers'

export interface TimecardWithEntries extends Timecard {
  entries: TimecardEntry[]
}

export interface TimecardPeriodRange {
  periodType: 'week' | 'month'
  periodStart: string
  periodEnd: string
}

type TimecardDbClient = Pick<typeof db, 'select' | 'insert' | 'update' | 'delete'>

interface TimecardReviewRow extends Record<string, unknown> {
  status: string
  user_id: string
  period_type: string
  period_start: string
  period_end: string
  payroll_batch_id: string | null
}

const TIMECARD_REVIEW_TRANSITIONS: TransitionTable = [
  { action: TIMECARD_STATUSES.APPROVED, from: TIMECARD_STATUSES.SUBMITTED, to: TIMECARD_STATUSES.APPROVED },
  { action: TIMECARD_STATUSES.REJECTED, from: TIMECARD_STATUSES.SUBMITTED, to: TIMECARD_STATUSES.REJECTED },
]

const TIMECARD_REOPEN_TRANSITIONS: TransitionTable = [
  { action: 'reopen', from: TIMECARD_STATUSES.SUBMITTED, to: TIMECARD_STATUSES.DRAFT },
  { action: 'reopen', from: TIMECARD_STATUSES.APPROVED, to: TIMECARD_STATUSES.DRAFT },
  { action: 'reopen', from: TIMECARD_STATUSES.REJECTED, to: TIMECARD_STATUSES.DRAFT },
]

const TIMECARD_REVIEW_GUARDS: readonly ReviewGuard<TimecardReviewRow>[] = [
  {
    code: 'self_review',
    check: (row, actor) => row.user_id !== actor.id,
  },
  {
    code: 'payroll_locked',
    check: row => row.payroll_batch_id == null,
  },
]

const TIMECARD_PAYROLL_GUARD: readonly ReviewGuard<TimecardReviewRow>[] = [
  {
    code: 'payroll_locked',
    check: row => row.payroll_batch_id == null,
  },
]

function startOfWeek(date: Date): Date {
  const next = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = next.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  next.setUTCDate(next.getUTCDate() + diff)
  return next
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

export function resolveTimecardPeriod(input?: TimecardPeriodQuery | null): TimecardPeriodRange {
  const parsed = timecardPeriodQuerySchema.safeParse(input ?? {})
  const periodType: 'week' | 'month' = parsed.success
    ? (parsed.data.period_type as 'week' | 'month')
    : 'month'
  const ref = parsed.success && parsed.data.period_date ? parseDate(parsed.data.period_date) : new Date()

  if (periodType === 'week') {
    const weekStart = startOfWeek(ref)
    return {
      periodType,
      periodStart: toISODate(weekStart),
      periodEnd: toISODate(addDays(weekStart, 7)),
    }
  }

  const monthStart = getMonthStart(ref)
  return {
    periodType,
    periodStart: toISODate(monthStart),
    periodEnd: toISODate(getNextMonthStart(ref)),
  }
}

async function getScheduleForUser(userId: string): Promise<WeeklySchedule> {
  const [profile] = await db
    .select({ workingHours: teamProfiles.workingHours })
    .from(teamProfiles)
    .where(eq(teamProfiles.userId, userId))
    .limit(1)

  return parseWeeklySchedule(profile?.workingHours ?? null)
}

async function fetchTimecardWithEntries(client: TimecardDbClient, timecardId: string): Promise<TimecardWithEntries | null> {
  const timecardRows = await client
    .select({
      id: timecards.id,
      user_id: timecards.userId,
      period_type: timecards.periodType,
      period_start: timecards.periodStart,
      period_end: timecards.periodEnd,
      status: timecards.status,
      notes: timecards.notes,
      submitted_at: timecards.submittedAt,
      reviewed_by: timecards.reviewedBy,
      reviewed_at: timecards.reviewedAt,
      review_notes: timecards.reviewNotes,
      created_at: timecards.createdAt,
      updated_at: timecards.updatedAt,
      user_name: users.name,
      user_email: users.email,
    })
    .from(timecards)
    .innerJoin(users, eq(timecards.userId, users.id))
    .where(eq(timecards.id, timecardId))
    .limit(1)
  const timecard = (timecardRows as Array<Record<string, any>>)[0]

  if (!timecard) return null

  const entryRows = await client
    .select({
      id: timecardEntries.id,
      timecard_id: timecardEntries.timecardId,
      user_id: timecardEntries.userId,
      work_date: timecardEntries.workDate,
      start_time: timecardEntries.startTime,
      end_time: timecardEntries.endTime,
      break_minutes: timecardEntries.breakMinutes,
      duration_minutes: timecardEntries.durationMinutes,
      category: timecardEntries.category,
      description: timecardEntries.description,
      task_id: timecardEntries.taskId,
      protocol_id: timecardEntries.protocolId,
      source: timecardEntries.source,
      created_at: timecardEntries.createdAt,
      updated_at: timecardEntries.updatedAt,
    })
    .from(timecardEntries)
    .where(eq(timecardEntries.timecardId, timecardId))
    .orderBy(asc(timecardEntries.workDate), asc(timecardEntries.createdAt))
  const entries: TimecardEntry[] = (entryRows as Array<Record<string, any>>).map(entry => ({
    id: entry.id,
    timecard_id: entry.timecard_id,
    user_id: entry.user_id,
    work_date: entry.work_date,
    start_time: normalizeTimeToHHMM(entry.start_time) ?? null,
    end_time: normalizeTimeToHHMM(entry.end_time) ?? null,
    break_minutes: entry.break_minutes ?? 0,
    duration_minutes: entry.duration_minutes,
    category: entry.category,
    description: entry.description ?? null,
    task_id: entry.task_id ?? null,
    protocol_id: entry.protocol_id ?? null,
    source: entry.source,
    created_at: entry.created_at ?? '',
    updated_at: entry.updated_at ?? '',
  }))

  const reviewerName = timecard.reviewed_by
    ? await client
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, timecard.reviewed_by))
      .then(rows => rows[0]?.name ?? null)
    : null

  return {
    id: timecard.id,
    user_id: timecard.user_id,
    user_name: timecard.user_name,
    user_email: timecard.user_email,
    period_type: timecard.period_type,
    period_start: timecard.period_start,
    period_end: timecard.period_end,
    status: timecard.status,
    notes: timecard.notes,
    submitted_at: timecard.submitted_at,
    reviewed_by: timecard.reviewed_by,
    reviewed_by_name: reviewerName,
    reviewed_at: timecard.reviewed_at,
    review_notes: timecard.review_notes,
    total_minutes: entries.reduce((sum, entry) => sum + entry.duration_minutes, 0),
    created_at: timecard.created_at,
    updated_at: timecard.updated_at,
    entries,
  }
}

async function createDraftForPeriod(userId: string, period: TimecardPeriodRange): Promise<TimecardWithEntries> {
  const schedule = await getScheduleForUser(userId)

  return db.transaction(async (tx) => {
    const existingRows = await tx
      .select({ id: timecards.id })
      .from(timecards)
      .where(and(
        eq(timecards.userId, userId),
        eq(timecards.periodStart, period.periodStart),
        eq(timecards.periodEnd, period.periodEnd),
      ))
      .limit(1)
    const existing = existingRows[0]

    if (existing) {
      const current = await fetchTimecardWithEntries(tx, existing.id)
      if (current) return current
    }

    const templateEntries = period.periodType === 'month'
      ? buildTimecardEntriesForMonth(schedule, parseDate(period.periodStart))
      : buildTimecardEntriesFromSchedule(schedule, period.periodStart)

    // Two first-hits for the same period race past the SELECT above (page
    // widget + direct API call); the UNIQUE(user_id, period_start, period_end)
    // key made the loser 500. DO NOTHING + re-fetch turns the race benign.
    const createdRows = await tx
      .insert(timecards)
      .values({
        userId,
        periodType: period.periodType,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        status: TIMECARD_STATUSES.DRAFT,
        notes: null,
      })
      .onConflictDoNothing({
        target: [timecards.userId, timecards.periodStart, timecards.periodEnd],
      })
      .returning({ id: timecards.id })
    const created = createdRows[0]

    if (!created) {
      // Lost the race — the concurrent request created the row; serve it.
      const raced = await tx
        .select({ id: timecards.id })
        .from(timecards)
        .where(and(
          eq(timecards.userId, userId),
          eq(timecards.periodStart, period.periodStart),
          eq(timecards.periodEnd, period.periodEnd),
        ))
        .limit(1)
      const racedExisting = raced[0]
        ? await fetchTimecardWithEntries(tx, raced[0].id)
        : null
      if (!racedExisting) throw new Error('timecard_creation_failed')
      return racedExisting
    }

    if (templateEntries.length > 0) {
      await tx.insert(timecardEntries).values(
        templateEntries.map(entry => ({
          timecardId: created.id,
          userId,
          workDate: entry.work_date,
          startTime: entry.start_time ?? null,
          endTime: entry.end_time ?? null,
          breakMinutes: entry.break_minutes ?? 0,
          durationMinutes: entry.duration_minutes,
          category: entry.category ?? 'other',
          description: entry.description ?? null,
          taskId: entry.task_id ?? null,
          protocolId: entry.protocol_id ?? null,
          source: entry.source ?? 'template',
        }))
      )
    }

    const ensured = await fetchTimecardWithEntries(tx, created.id)
    if (!ensured) throw new Error('timecard_creation_failed')
    return ensured
  })
}

export async function getOrCreateTimecardForUser(
  userId: string,
  periodInput?: TimecardPeriodQuery | null
): Promise<TimecardWithEntries> {
  const period = resolveTimecardPeriod(periodInput)
  const existingRows = await db
    .select({ id: timecards.id })
    .from(timecards)
    .where(and(
      eq(timecards.userId, userId),
      eq(timecards.periodStart, period.periodStart),
      eq(timecards.periodEnd, period.periodEnd),
    ))
    .limit(1)
  const existing = existingRows[0]

  if (existing) {
      const current = await fetchTimecardWithEntries(db, existing.id)
    if (current) return current
  }

  return createDraftForPeriod(userId, period)
}

export async function listTimecards(params: {
  userId?: string
  status?: string
  periodType?: 'week' | 'month'
  periodStart?: string
  periodEnd?: string
  limit?: number
  offset?: number
} = {}) {
  // LEFT JOIN team_profiles so the admin approval queue can show
  // department + position next to each name without a second round trip.
  // Some users (e.g. external buyers) won't have a profile; those rows
  // simply get NULL dept/position and the UI handles that.
  const query = db
    .select({
      id: timecards.id,
      user_id: timecards.userId,
      user_name: users.name,
      user_email: users.email,
      team_profile_id: teamProfiles.id,
      department: teamProfiles.department,
      position: teamProfiles.position,
      employment_type: teamProfiles.employmentType,
      period_type: timecards.periodType,
      period_start: timecards.periodStart,
      period_end: timecards.periodEnd,
      status: timecards.status,
      notes: timecards.notes,
      submitted_at: timecards.submittedAt,
      reviewed_by: timecards.reviewedBy,
      reviewed_at: timecards.reviewedAt,
      review_notes: timecards.reviewNotes,
      created_at: timecards.createdAt,
      updated_at: timecards.updatedAt,
      total_minutes: sql<number>`COALESCE(SUM(${timecardEntries.durationMinutes}), 0)`,
    })
    .from(timecards)
    .innerJoin(users, eq(timecards.userId, users.id))
    .leftJoin(teamProfiles, eq(teamProfiles.userId, timecards.userId))
    .leftJoin(timecardEntries, eq(timecardEntries.timecardId, timecards.id))

  const conditions = []
  if (params.userId) {
    conditions.push(eq(timecards.userId, params.userId))
  }
  if (params.status && params.status !== 'all') {
    conditions.push(eq(timecards.status, params.status))
  }
  if (params.periodType) {
    conditions.push(eq(timecards.periodType, params.periodType))
  }
  if (params.periodStart) {
    conditions.push(gte(timecards.periodStart, params.periodStart))
  }
  if (params.periodEnd) {
    conditions.push(lte(timecards.periodEnd, params.periodEnd))
  }

  const rows = await query
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(
      timecards.id,
      users.name,
      users.email,
      teamProfiles.id,
      teamProfiles.department,
      teamProfiles.position,
      teamProfiles.employmentType,
    )
    .orderBy(asc(timecards.periodStart), asc(timecards.createdAt))
    .limit(params.limit ?? 50)
    .offset(params.offset ?? 0)

  return rows
}

export async function saveTimecardDraft(
  userId: string,
  input: TimecardSaveInput,
  options: { keepSubmitted?: boolean } = {},
): Promise<TimecardWithEntries> {
  const parsed = timecardSaveSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error('invalid_timecard_payload')
  }

  return db.transaction(async (tx) => {
    const rowRows = await tx
      .select()
      .from(timecards)
      .where(and(
        eq(timecards.userId, userId),
        eq(timecards.periodStart, parsed.data.period_start),
        eq(timecards.periodEnd, parsed.data.period_end),
      ))
      .limit(1)
    const row = rowRows[0] as Record<string, any> | undefined

    if (row && row.status === TIMECARD_STATUSES.APPROVED) {
      throw new Error('approved_timecard_locked')
    }
    // Once a payroll batch references the card, its hours are financial
    // history — edits would desync the payroll snapshot.
    if (row && row.payrollBatchId != null) {
      throw new Error('timecard_payroll_locked')
    }

    // Any content edit invalidates a pending submission: the card drops back
    // to draft so an approver never reviews silently-changed data. The
    // approver review-edit path opts out (keepSubmitted) — that path is
    // audited and notifies the owner instead.
    const demoteToDraft =
      row !== undefined &&
      (row.status === TIMECARD_STATUSES.REJECTED ||
        (row.status === TIMECARD_STATUSES.SUBMITTED && !options.keepSubmitted))

    const returnedRows = row
      ? await tx
          .update(timecards)
          .set({
            periodType: parsed.data.period_type,
            notes: parsed.data.notes ?? null,
            status: demoteToDraft ? TIMECARD_STATUSES.DRAFT : row.status,
            ...(demoteToDraft ? { submittedAt: null } : {}),
            updatedAt: sql`NOW()`,
          })
          .where(eq(timecards.id, row.id))
          .returning({ id: timecards.id })
      : await tx
          .insert(timecards)
          .values({
            userId,
            periodType: parsed.data.period_type,
            periodStart: parsed.data.period_start,
            periodEnd: parsed.data.period_end,
            notes: parsed.data.notes ?? null,
            status: TIMECARD_STATUSES.DRAFT,
          })
          .returning({ id: timecards.id })

    const timecardRow = returnedRows[0]
    if (!timecardRow) {
      throw new Error('timecard_save_failed')
    }

    await tx.delete(timecardEntries).where(eq(timecardEntries.timecardId, timecardRow.id))

    if (parsed.data.entries.length > 0) {
      await tx.insert(timecardEntries).values(
        parsed.data.entries.map(entry => ({
          timecardId: timecardRow.id,
          userId,
          workDate: entry.work_date,
          startTime: entry.start_time ?? null,
          endTime: entry.end_time ?? null,
          breakMinutes: entry.break_minutes ?? 0,
          durationMinutes: entry.duration_minutes,
          category: entry.category ?? 'other',
          description: entry.description ?? null,
          taskId: entry.task_id ?? null,
          protocolId: entry.protocol_id ?? null,
          source: entry.source ?? 'manual',
        }))
      )
    }

    const result = await fetchTimecardWithEntries(tx, timecardRow.id)
    if (!result) throw new Error('timecard_save_failed')
    return result
  })
}

export async function submitTimecard(userId: string, input: TimecardSaveInput): Promise<TimecardWithEntries> {
  const saved = await saveTimecardDraft(userId, input)

  if (saved.status === TIMECARD_STATUSES.APPROVED) {
    throw new Error('approved_timecard_locked')
  }

  await db
    .update(timecards)
    .set({
      status: TIMECARD_STATUSES.SUBMITTED,
      submittedAt: sql`NOW()`,
      updatedAt: sql`NOW()`,
    })
    .where(eq(timecards.id, saved.id))

  const periodLabel = formatTimecardPeriodLabel(saved.period_type, saved.period_start, saved.period_end)

  logActivity({
    actorId: userId,
    action: 'submitted_timecard',
    subjectType: 'timecard',
    subjectId: saved.id,
    subjectLabel: periodLabel,
  })

  const submitted = (await fetchTimecardWithEntries(db, saved.id)) ?? saved
  const displayName = submitted.user_name || submitted.user_email || 'Ein Teammitglied'

  // Two notifications on submit, each with its own email:
  //   1. every OTHER approver → "a timecard needs your review"
  //   2. the SUBMITTER → an emailed confirmation (inline UI isn't an email). In
  //      a small org the submitter is often the sole approver, so this also
  //      tells them they can approve it themselves — previously nobody got
  //      anything at all in that case.
  // Resubmits REPLACE the previous entries for this card (delete by related_id
  // + type) instead of stacking, so there's exactly one live entry per kind.
  try {
    const allApproverIds = await getTimecardApproverIds()
    const otherApproverIds = allApproverIds.filter((id) => id !== userId)
    const submitterIsApprover = allApproverIds.includes(userId)

    await db.delete(notifications).where(and(
      eq(notifications.relatedId, submitted.id),
      or(
        eq(notifications.type, NOTIFICATION_TYPES.TIMECARD_SUBMITTED),
        eq(notifications.type, NOTIFICATION_TYPES.TIMECARD_SUBMIT_CONFIRMED),
      ),
    ))

    if (otherApproverIds.length > 0) {
      await notifyUsers(otherApproverIds, {
        type: NOTIFICATION_TYPES.TIMECARD_SUBMITTED,
        title: 'Neue Zeitkarte eingereicht',
        content: `${displayName} hat die Zeitkarte für ${periodLabel} zur Prüfung eingereicht.`,
        related_type: RELATED_TYPES.TIMECARD_REVIEW,
        related_id: submitted.id,
      })
    }

    await createNotification(userId, {
      type: NOTIFICATION_TYPES.TIMECARD_SUBMIT_CONFIRMED,
      title: 'Zeitkarte eingereicht',
      content: submitterIsApprover && otherApproverIds.length === 0
        ? `Deine Zeitkarte für ${periodLabel} wurde eingereicht. Als Freigabeberechtigte:r kannst du sie selbst freigeben.`
        : `Deine Zeitkarte für ${periodLabel} wurde zur Freigabe eingereicht.`,
      related_type: submitterIsApprover ? RELATED_TYPES.TIMECARD_REVIEW : RELATED_TYPES.TIMECARD,
      related_id: submitted.id,
    })
  } catch (error) {
    logger.warn('Failed to send timecard submission notifications', { error, timecardId: saved.id })
  }

  return submitted
}

/** Fetch one timecard with its entries for approver review (by card id). */
export async function getTimecardByIdForReview(timecardId: string): Promise<TimecardWithEntries | null> {
  return fetchTimecardWithEntries(db, timecardId)
}

/**
 * Approver edits a submitted card's entries. Saves to the card's OWNER (not the
 * approver) and preserves the submitted status (keepSubmitted). Never silent:
 * the edit lands in the activity log and the owner is notified — otherwise an
 * approver could rewrite someone's hours and approve their own numbers without
 * a trace. Authorization is enforced at the route (withAdmin('timecards')).
 */
export async function saveTimecardEntriesForReview(
  timecardId: string,
  input: TimecardSaveInput,
  reviewerId: string,
): Promise<TimecardWithEntries> {
  const rows = await db
    .select({ userId: timecards.userId })
    .from(timecards)
    .where(eq(timecards.id, timecardId))
    .limit(1)
  const owner = rows[0]
  if (!owner) throw new Error('timecard_not_found')

  const result = await saveTimecardDraft(owner.userId, input, { keepSubmitted: true })

  if (owner.userId !== reviewerId) {
    const periodLabel = formatTimecardPeriodLabel(result.period_type, result.period_start, result.period_end)

    logActivity({
      actorId: reviewerId,
      action: 'edited_timecard',
      subjectType: 'timecard',
      subjectId: timecardId,
      subjectLabel: periodLabel,
    })

    const reviewerRows = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, reviewerId))
      .limit(1)
    const reviewerName = reviewerRows[0]?.name || reviewerRows[0]?.email || 'Ein Teammitglied'

    await createNotification(owner.userId, {
      type: NOTIFICATION_TYPES.TIMECARD_REVIEWED,
      title: 'Zeitkarte angepasst',
      content: `${reviewerName} hat deine Zeitkarte für ${periodLabel} angepasst. Bitte sieh dir die Einträge an.`,
      related_type: RELATED_TYPES.TIMECARD,
      related_id: timecardId,
    }).catch(err => logger.warn('Failed to notify timecard owner about approver edit', { error: err, timecardId }))
  }

  return result
}

/**
 * Reopen a reviewed/locked timecard back to draft so it can be edited again
 * (e.g. a card approved by mistake — like an approved-empty month). Clears the
 * review + submission metadata, logs the actor, and notifies the owner —
 * un-approving hours must never happen invisibly. Refuses payroll-linked cards
 * (that history is closed; corrections go through a new batch). Authorization
 * is enforced at the route (withAdmin('timecards')).
 */
export async function reopenTimecard(timecardId: string, actorId: string): Promise<TimecardWithEntries> {
  const result = await runReviewTransition<TimecardReviewRow>({
    target: {
      table: 'timecards',
      select: ['user_id', 'period_type', 'period_start', 'period_end', 'payroll_batch_id'],
    },
    transitions: TIMECARD_REOPEN_TRANSITIONS,
    id: timecardId,
    action: 'reopen',
    actor: { id: actorId },
    guards: TIMECARD_PAYROLL_GUARD,
    write: {
      reopen: {
        reviewer: 'clear',
        reason: 'clear',
        extra: () => ({ submitted_at: null }),
      },
    },
    emit: (row): WorkflowEvent => {
      const periodLabel = formatTimecardPeriodLabel(row.period_type, row.period_start, row.period_end)
      const event: WorkflowEvent = {
        type: NOTIFICATION_TYPES.TIMECARD_REVIEWED,
        related: { type: RELATED_TYPES.TIMECARD, id: timecardId },
        activity: {
          actorId,
          action: 'reopened_timecard',
          subjectType: 'timecard',
          subjectId: timecardId,
          subjectLabel: periodLabel,
        },
      }

      if (row.user_id !== actorId) {
        event.recipients = { userId: row.user_id }
        event.title = 'Zeitkarte wieder geöffnet'
        event.content = `Deine Zeitkarte für ${periodLabel} wurde wieder geöffnet und kann angepasst werden.`
      }

      return event
    },
  })

  if (!result.ok) {
    if (result.code === 'not_found') throw new Error('timecard_not_found')
    if (result.code === 'guard_failed' && result.guard === 'payroll_locked') throw new Error('timecard_payroll_locked')
    throw new Error('timecard_not_submitted')
  }

  const reopened = await fetchTimecardWithEntries(db, timecardId)
  if (!reopened) throw new Error('timecard_not_found')
  return reopened
}

export async function reviewTimecard(
  reviewerId: string,
  timecardId: string,
  input: TimecardReviewActionInput,
  opts?: { allowSelfReview?: boolean }
): Promise<TimecardWithEntries> {
  const parsed = timecardReviewActionSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error('invalid_timecard_review')
  }

  // Super-admins may approve their OWN timecards — in a small org they're often
  // the only approver, so the separation-of-duties block would otherwise leave
  // their cards permanently unapprovable. Regular approvers still need a
  // colleague: the self_review guard stays for them.
  const guards = opts?.allowSelfReview
    ? TIMECARD_REVIEW_GUARDS.filter((g) => g.code !== 'self_review')
    : TIMECARD_REVIEW_GUARDS

  const result = await runReviewTransition<TimecardReviewRow>({
    target: {
      table: 'timecards',
      select: ['user_id', 'period_type', 'period_start', 'period_end', 'payroll_batch_id'],
    },
    transitions: TIMECARD_REVIEW_TRANSITIONS,
    id: timecardId,
    action: parsed.data.status,
    actor: { id: reviewerId },
    guards,
    reason: parsed.data.review_notes ?? null,
    emit: (row): WorkflowEvent => {
      const reviewPeriodLabel = formatTimecardPeriodLabel(row.period_type, row.period_start, row.period_end)
      const approved = parsed.data.status === TIMECARD_STATUSES.APPROVED
      return {
        type: NOTIFICATION_TYPES.TIMECARD_REVIEWED,
        recipients: { userId: row.user_id },
        title: approved ? 'Zeitkarte genehmigt' : 'Zeitkarte benötigt Anpassung',
        content: approved
          ? `Deine Zeitkarte für ${reviewPeriodLabel} wurde genehmigt.`
          : `Deine Zeitkarte für ${reviewPeriodLabel} wurde zurückgewiesen. ${parsed.data.review_notes ?? ''}`.trim(),
        related: { type: RELATED_TYPES.TIMECARD, id: timecardId },
        activity: {
          actorId: reviewerId,
          action: approved ? 'approved_timecard' : 'rejected_timecard',
          subjectType: 'timecard',
          subjectId: timecardId,
          subjectLabel: reviewPeriodLabel,
        },
      }
    },
  })

  if (!result.ok) {
    if (result.code === 'not_found') throw new Error('timecard_not_found')
    if (result.code === 'guard_failed' && result.guard === 'self_review') throw new Error('timecard_self_review')
    if (result.code === 'guard_failed' && result.guard === 'payroll_locked') throw new Error('timecard_payroll_locked')
    throw new Error('timecard_not_submitted')
  }

  const reviewed = await fetchTimecardWithEntries(db, timecardId)
  if (!reviewed) throw new Error('timecard_review_failed')
  return reviewed
}
