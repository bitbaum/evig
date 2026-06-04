/**
 * Cron: Wake recurring_scheduled tasks when their schedule fires.
 *
 * GET /api/cron/wake-recurring-tasks
 *
 * Schedule: hourly (top of the hour).
 *
 * Why: tasks with task_type='recurring_scheduled' and a schedule_cron
 * expression are supposed to surface in the team queue on every
 * scheduled run (e.g. "clean kitchen every Monday at 08:00"). Without
 * this worker, the schedule_cron column was decorative — completing a
 * recurring task reset it to 'idle' but nothing ever flipped it back
 * to 'needs_attention'. Per the BB audit's recurring-task finding.
 *
 * Algorithm:
 *   For each active recurring_scheduled task with schedule_cron set,
 *   parse the cron expression in Europe/Zurich tz, get the most recent
 *   scheduled fire time (`.prev()`). If:
 *     - the task isn't already 'needs_attention' or 'in_progress', AND
 *     - the task hasn't been completed at-or-after that fire time
 *   then flip to 'needs_attention' and notify the assignee (or all
 *   staff if it's an unassigned broadcast).
 *
 * Protected by CRON_SECRET (Authorization: Bearer ...).
 */

import { NextRequest } from 'next/server'
import { CronExpressionParser } from 'cron-parser'
import { db } from '@/db'
import { tasks } from '@/db/schema'
import { eq, and, isNotNull, sql } from 'drizzle-orm'
import { TASK_STATUSES, TASK_TYPES } from '@/config/tasks'
import { notifyUsers, notifyAllStaff } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'
import { logger } from '@/lib/logger'

const CRON_TZ = 'Europe/Zurich'

function authorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true // dev: allow if not configured
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const candidates = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        scheduleCron: tasks.scheduleCron,
        currentStatus: tasks.currentStatus,
        completedAt: tasks.completedAt,
        assignedTo: tasks.assignedTo,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.taskType, TASK_TYPES.RECURRING_SCHEDULED),
          isNotNull(tasks.scheduleCron),
          eq(tasks.isArchived, false),
        ),
      )

    const woken: string[] = []
    const skipped: { id: string; reason: string }[] = []
    const errors: { id: string; error: string }[] = []

    for (const task of candidates) {
      if (!task.scheduleCron) continue
      try {
        const expr = CronExpressionParser.parse(task.scheduleCron, { tz: CRON_TZ })
        const prevFire = expr.prev().toDate()

        // Already pending — don't pile up.
        if (
          task.currentStatus === TASK_STATUSES.NEEDS_ATTENTION ||
          task.currentStatus === TASK_STATUSES.IN_PROGRESS ||
          task.currentStatus === TASK_STATUSES.REQUESTED
        ) {
          skipped.push({ id: task.id, reason: 'already_active' })
          continue
        }

        // Already done for this iteration — wait for the next fire.
        if (task.completedAt && new Date(task.completedAt) >= prevFire) {
          skipped.push({ id: task.id, reason: 'already_completed_this_iteration' })
          continue
        }

        // Wake the task.
        await db
          .update(tasks)
          .set({
            currentStatus: TASK_STATUSES.NEEDS_ATTENTION,
            updatedAt: sql`NOW()`,
          })
          .where(eq(tasks.id, task.id))

        woken.push(task.id)

        // Notify. Assigned tasks → the assignee; unassigned (broadcast
        // by design — recurring tasks like "clean kitchen" often have
        // no fixed owner) → all staff.
        const notifyPayload = {
          type: NOTIFICATION_TYPES.TASK_ATTENTION,
          title: `Wiederkehrende Aufgabe fällig: ${task.title}`,
          content: `Geplant für ${prevFire.toLocaleString('de-CH', { timeZone: CRON_TZ })}.`,
          related_type: RELATED_TYPES.TASK,
          related_id: task.id,
        }
        const notifyPromise = task.assignedTo
          ? notifyUsers([task.assignedTo], notifyPayload)
          : notifyAllStaff(notifyPayload)
        notifyPromise.catch((err) =>
          logger.warn('Failed to notify on recurring task wake', { error: err, taskId: task.id }),
        )
      } catch (err) {
        errors.push({
          id: task.id,
          error: err instanceof Error ? err.message : String(err),
        })
        logger.error('Failed to parse cron expression for recurring task', {
          taskId: task.id,
          scheduleCron: task.scheduleCron,
          error: err,
        })
      }
    }

    logger.info('wake-recurring-tasks cron complete', {
      candidates: candidates.length,
      woken: woken.length,
      skipped: skipped.length,
      errors: errors.length,
    })

    return Response.json({
      candidates: candidates.length,
      woken: woken.length,
      skipped: skipped.length,
      errors: errors.length,
      // Detail only in non-prod for debugging; prod stays quiet.
      ...(process.env.NODE_ENV !== 'production' && { detail: { woken, skipped, errors } }),
    })
  } catch (error) {
    logger.error('wake-recurring-tasks cron failed', { error })
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
