/**
 * PATCH /api/admin/time-off/:id  → approve or reject a pending request.
 * Requires the `timecards` section permission (super admins always pass).
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiBadRequest, apiNotFound, apiError } from '@/lib/api/helpers'
import { reviewTimeOffSchema } from '@/lib/schemas/time-off'
import { reviewTimeOffRequest } from '@/lib/services/time-off'

export const PATCH = withAdmin<{ id: string }>(
  'timecards',
  async (request: NextRequest, session: ValidSession, ctx?: { params?: { id: string } }) => {
    try {
      const id = ctx?.params?.id
      if (!id) return apiNotFound('Antrag')
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return apiBadRequest('Ungültiger JSON-Body')
      }
      const parsed = reviewTimeOffSchema.safeParse(body)
      if (!parsed.success) {
        return apiBadRequest('Ungültige Eingabe', parsed.error.flatten().fieldErrors)
      }
      const reviewed = await reviewTimeOffRequest(session.user.id, id, parsed.data)
      if (!reviewed) return apiNotFound('Offener Antrag')
      return apiSuccess(reviewed)
    } catch (error) {
      return apiError(error, 'Antrag konnte nicht bearbeitet werden.')
    }
  },
)
