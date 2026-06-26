/**
 * POST /api/admin/hr/applications/[id]/hire
 */

import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { hireApplicationSchema } from '@/lib/schemas/hr-vacancies'
import { hireApplication } from '@/lib/services/hr-applications'
import { notifyApplicantStatusChange } from '@/lib/hr/notifications'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS } from '@/config/hr-application-status'
import { ROUTES } from '@/config/routes'
import { logger } from '@/lib/logger'

export const POST = withAdmin<{ id: string }>('team', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error

    const body = await request.json().catch(() => ({}))
    const parsed = hireApplicationSchema.safeParse(body)
    if (!parsed.success) return apiBadRequest(parsed.error.issues[0]?.message ?? 'Ungültig')

    const result = await hireApplication(id, userLookup.dbUserId, parsed.data)

    if (!result.ok) {
      if (result.error === 'not_found') return apiNotFound('Bewerbung')
      if (result.error === 'profile_exists') {
        return apiBadRequest('Für diese Person existiert bereits ein Team-Profil.')
      }
      if (result.error === 'invalid_status_for_hire') {
        return apiBadRequest('Bewerbung kann in diesem Status nicht eingestellt werden.')
      }
      return apiBadRequest('Einstellung fehlgeschlagen')
    }

    void notifyApplicantStatusChange(
      result.application.user_id,
      result.application.applicant_email,
      result.application.posting_title ?? 'Stelle',
      APPLICATION_STATUS_LABELS[APPLICATION_STATUS.HIRED],
      result.application.id,
    )

    logger.info('HR application hired', {
      applicationId: id,
      teamProfileId: result.teamProfileId,
    })

    return apiSuccess({
      team_profile_id: result.teamProfileId,
      team_profile_url: ROUTES.admin.team + `/${result.teamProfileId}`,
      application: result.application,
    })
  } catch (error) {
    logger.error('Failed to hire applicant', { error })
    return apiError(error, 'Einstellung fehlgeschlagen')
  }
})
