import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiNotFound, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { createNotification } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'
import { formatDateShort } from '@/lib/date-formats'
import { logActivity } from '@/lib/activity'

// Membership fees arrive by bank transfer; staff confirm receipt here. This is
// the ONLY writer of users.member_paid_until — the admin membership page reads
// it for the Bezahlt/Offen status, the member dashboard mirrors it.
const recordPaymentSchema = z.object({
  paid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum im Format JJJJ-MM-TT erwartet'),
})

export const PATCH = withAdmin('membership', async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('Mitglieds-ID ist erforderlich')

    const body = await request.json()
    const parsed = recordPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest('Ungültige Eingabedaten', parsed.error.flatten().fieldErrors)
    }

    const paidUntil = new Date(`${parsed.data.paid_until}T00:00:00.000Z`)
    if (Number.isNaN(paidUntil.getTime())) {
      return apiBadRequest('Ungültiges Datum')
    }

    const result = await query<{ id: string; name: string | null }>(
      `UPDATE ${TABLE_NAMES.USERS}
       SET member_paid_until = $1
       WHERE id = $2 AND is_member = true
       RETURNING id, name`,
      [paidUntil.toISOString(), id]
    )
    if (result.rows.length === 0) {
      return apiNotFound('Mitglied')
    }

    logActivity({
      actorId: session.user.id,
      action: 'recorded_membership_payment',
      subjectType: 'membership',
      subjectId: id,
      subjectLabel: result.rows[0].name ?? undefined,
    })

    await createNotification(id, {
      type: NOTIFICATION_TYPES.MEMBERSHIP_PAYMENT_RECORDED,
      title: 'Mitgliederbeitrag erhalten',
      content: `Danke! Dein Mitgliederbeitrag ist eingegangen — deine Mitgliedschaft ist bezahlt bis ${formatDateShort(parsed.data.paid_until)}.`,
      related_type: RELATED_TYPES.MEMBERSHIP,
      related_id: id,
    }).catch(err => logger.warn('Failed to notify member about recorded payment', { error: err, memberId: id }))

    return apiSuccess({ id, paid_until: paidUntil.toISOString() })
  } catch (error) {
    logger.error('Error recording membership payment', { error, adminId: session.user.id })
    return apiError(error, 'Zahlung konnte nicht erfasst werden')
  }
})
