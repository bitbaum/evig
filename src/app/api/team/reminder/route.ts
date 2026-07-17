/**
 * PUT /api/team/reminder — personal monthly Zeiterfassung reminder.
 *
 * Body: { day: number | null }  (1–28; null switches the reminder off).
 * Fires via the timecard-reminders cron: an in-app + e-mail nudge on that
 * day of month if the current month's card is not submitted yet.
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { teamProfiles } from '@/db/schema'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

const bodySchema = z.object({ day: z.number().int().min(1).max(28).nullable() })

export const PUT = withAdmin(async (request: NextRequest, session: ValidSession) => {
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) return apiBadRequest('Ungültiger Erinnerungstag (1–28 oder null).')

    await db
      .insert(teamProfiles)
      .values({ userId: session.user.id, zeiterfassungReminderDay: parsed.data.day })
      .onConflictDoUpdate({
        target: teamProfiles.userId,
        set: { zeiterfassungReminderDay: parsed.data.day, updatedAt: new Date().toISOString() },
      })

    return apiSuccess({ day: parsed.data.day })
  } catch (error) {
    logger.error('Error saving reminder day', { error, userId: session.user.id })
    return apiError(error, 'Erinnerung konnte nicht gespeichert werden')
  }
})
