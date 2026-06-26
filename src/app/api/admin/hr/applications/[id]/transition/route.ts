/**
 * POST /api/admin/hr/applications/[id]/transition
 */

import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { transitionApplicationSchema } from '@/lib/schemas/hr-vacancies'
import { transitionApplication } from '@/lib/services/hr-applications'
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
} from '@/config/hr-application-status'
import { notifyApplicantStatusChange } from '@/lib/hr/notifications'
import { logger } from '@/lib/logger'

export const POST = withAdmin<{ id: string }>('team', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error

    const body = await request.json()
    const parsed = transitionApplicationSchema.safeParse(body)
    if (!parsed.success) return apiBadRequest(parsed.error.issues[0]?.message ?? 'Ungültig')

    const result = await transitionApplication(
      id,
      parsed.data.status as ApplicationStatus,
      userLookup.dbUserId,
      {
        rejection_reason: parsed.data.rejection_reason,
        admin_notes: parsed.data.admin_notes,
      },
    )

    if (!result.ok) {
      if (result.error === 'not_found') return apiNotFound('Bewerbung')
      if (result.error === 'invalid_transition') return apiBadRequest('Ungültiger Statuswechsel')
      return apiBadRequest('Aktualisierung fehlgeschlagen')
    }

    void notifyApplicantStatusChange(
      result.application.user_id,
      result.application.applicant_email,
      result.application.posting_title ?? 'Stelle',
      APPLICATION_STATUS_LABELS[parsed.data.status as ApplicationStatus],
      result.application.id,
    )

    return apiSuccess(result.application)
  } catch (error) {
    logger.error('Failed to transition HR application', { error })
    return apiError(error, 'Statuswechsel fehlgeschlagen')
  }
})
