/**
 * Cron: monthly Zeiterfassung reminders.
 *
 * GET /api/cron/timecard-reminders — daily (systemd revampit-cron@ template
 * on prod). For every active team profile whose zeiterfassung_reminder_day
 * equals today (Europe/Zurich) and whose current-month card is not yet
 * submitted/approved: one in-app notification (+ e-mail via the notification
 * pipeline) linking straight to /admin/zeiterfassung, where «Monat aus Plan
 * füllen & einreichen» finishes the job in one click.
 *
 * Protected by CRON_SECRET (Authorization: Bearer ...).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getReminderUserIdsForToday } from '@/lib/services/saldo'
import { createNotification } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES } from '@/config/notifications'
import { logger } from '@/lib/logger'

function authorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return request.headers.get('authorization') === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const userIds = await getReminderUserIdsForToday()
    const monthLabel = new Intl.DateTimeFormat('de-CH', {
      month: 'long', year: 'numeric', timeZone: 'Europe/Zurich',
    }).format(new Date())

    for (const userId of userIds) {
      await createNotification(userId, {
        type: NOTIFICATION_TYPES.TIMECARD_REMINDER,
        title: 'Zeiterfassung ausfüllen',
        content: `Deine Zeitkarte für ${monthLabel} ist noch nicht eingereicht. Mit «Monat aus Plan füllen & einreichen» ist es ein Klick: /admin/zeiterfassung`,
      }).catch(err => logger.warn('Timecard reminder failed', { error: err, userId }))
    }

    logger.info('Timecard reminders sent', { count: userIds.length })
    return NextResponse.json({ success: true, reminded: userIds.length })
  } catch (error) {
    logger.error('Timecard reminder cron failed', { error })
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
