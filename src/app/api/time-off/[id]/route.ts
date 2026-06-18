/**
 * PATCH /api/time-off/:id  → requester cancels their own pending request.
 */

import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiForbidden, apiNotFound, apiError } from '@/lib/api/helpers'
import { isStaffEmail } from '@/lib/permissions'
import { cancelTimeOffRequest } from '@/lib/services/time-off'

export const PATCH = withAuth<{ id: string }>(
  async (_req: NextRequest, session: ValidSession, ctx?: { params?: { id: string } }) => {
    try {
      if (!isStaffEmail(session.user.email)) return apiForbidden('Nur für Teammitglieder.')
      const id = ctx?.params?.id
      if (!id) return apiNotFound('Antrag')
      const cancelled = await cancelTimeOffRequest(session.user.id, id)
      if (!cancelled) return apiNotFound('Offener Antrag')
      return apiSuccess(cancelled)
    } catch (error) {
      return apiError(error, 'Antrag konnte nicht zurückgezogen werden.')
    }
  },
)
