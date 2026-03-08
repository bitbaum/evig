import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'

interface UpdateBody {
  feedback?: string
  rating?: number
}

// Cancel workshop registration (set status = 'cancelled')
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }
    let body: UpdateBody | null = null
    try {
      body = await req.json()
    } catch {
      body = null
    }

    if (body && (body.feedback !== undefined || body.rating !== undefined)) {
      const updates: string[] = []
      const paramsArr: unknown[] = []
      let p = 1

      if (body.feedback !== undefined) {
        updates.push(`feedback = $${p++}`)
        paramsArr.push(String(body.feedback))
      }
      if (body.rating !== undefined) {
        const r = Number(body.rating)
        if (!Number.isFinite(r) || r < 1 || r > 5) {
          return apiBadRequest('Ungültige Bewertung (1-5)')
        }
        updates.push(`rating = $${p++}`)
        paramsArr.push(Math.round(r))
      }

      paramsArr.push(id, session.user.id)
      const res = await query(
        `UPDATE ${TABLE_NAMES.WORKSHOP_REGISTRATIONS}
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${p++} AND user_id = $${p}
         RETURNING id`,
        paramsArr
      )

      if (res.rowCount === 0) {
        return apiNotFound('Anmeldung')
      }
      return apiSuccess({})
    }

    // Default action: cancel registration if not already cancelled
    const res = await query(
      `UPDATE ${TABLE_NAMES.WORKSHOP_REGISTRATIONS}
       SET status = '${WORKSHOP_REGISTRATION_STATUS.CANCELLED}', cancelled_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status != '${WORKSHOP_REGISTRATION_STATUS.CANCELLED}'
       RETURNING id` ,
      [id, session.user.id]
    )

    if (res.rowCount === 0) {
      return apiBadRequest('Anmeldung nicht gefunden oder bereits storniert')
    }

    return apiSuccess({})
  } catch (e) {
    return apiError(e, 'Stornierung fehlgeschlagen')
  }
}
