/**
 * GET /api/timecards/saldo — Zeit- und Feriensaldo.
 *
 * Own saldo for any staff member; another member's via ?user_id= for
 * approvers (timecards permission) — used by the admin team profile tab.
 * Returns { saldo: null } when the person has no Pensum on file
 * (volunteers) so the UI can simply hide the card.
 */

import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiForbidden, apiError, apiSuccess } from '@/lib/api/helpers'
import { canAccessSection } from '@/lib/permissions'
import { getPersonSaldo } from '@/lib/services/saldo'
import { logger } from '@/lib/logger'

export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {
  try {
    const requested = new URL(request.url).searchParams.get('user_id')
    let userId = session.user.id
    if (requested && requested !== session.user.id) {
      const viewer = {
        email: session.user.email,
        is_staff: session.user.isStaff,
        staff_permissions: session.user.staffPermissions,
        is_super_admin: session.user.isSuperAdmin,
      }
      if (!canAccessSection(viewer, 'timecards')) {
        return apiForbidden('Keine Berechtigung für fremde Salden.')
      }
      userId = requested
    }
    const saldo = await getPersonSaldo(userId)
    return apiSuccess({ saldo })
  } catch (error) {
    logger.error('Error computing saldo', { error, userId: session.user.id })
    return apiError(error, 'Saldo konnte nicht berechnet werden')
  }
})
