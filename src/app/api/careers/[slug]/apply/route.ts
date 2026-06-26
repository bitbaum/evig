/**
 * Submit job application
 * POST /api/careers/[slug]/apply
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { submitApplicationSchema, validateTrackResponses } from '@/lib/schemas/hr-vacancies'
import { getVacancyBySlug } from '@/lib/services/hr-vacancies'
import { submitApplication } from '@/lib/services/hr-applications'
import { PUBLIC_VACANCY_STATUSES, vacancyAcceptsApplications } from '@/config/hr-vacancies'
import { rateLimiters, getClientIdentifier } from '@/lib/security/rate-limit'
import { isE2ETestAccountEmail } from '@/config/e2e-test-accounts'
import {
  notifyApplicantConfirmation,
  notifyStaffNewApplication,
} from '@/lib/hr/notifications'
import { logger } from '@/lib/logger'

type Params = { slug: string }

export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const session = await auth()
    const { slug } = await context.params
    const posting = await getVacancyBySlug(slug)

    if (!posting || !PUBLIC_VACANCY_STATUSES.includes(posting.status as typeof PUBLIC_VACANCY_STATUSES[number])) {
      return apiNotFound('Stelle')
    }

    if (!vacancyAcceptsApplications(posting.status as import('@/config/hr-vacancies').VacancyStatus)) {
      return apiBadRequest('Für diese Stelle werden derzeit keine Bewerbungen angenommen.')
    }

    const body = await request.json()
    const parsed = submitApplicationSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0]?.message ?? 'Ungültige Angaben')
    }

    const trackValidation = validateTrackResponses(posting.role_track, parsed.data.track_responses)
    if (!trackValidation.success) {
      return apiBadRequest(trackValidation.error)
    }

    const email = parsed.data.applicant_email.toLowerCase()
    const rateKey = `${email}:job-apply`
    if (
      !isE2ETestAccountEmail(session?.user?.email ?? email) &&
      !rateLimiters.jobApplicationCreate(rateKey) &&
      !rateLimiters.jobApplicationCreate(`${getClientIdentifier(request)}:job-apply-anon`)
    ) {
      return apiBadRequest('Zu viele Bewerbungen. Bitte versuche es später erneut.')
    }

    const result = await submitApplication(
      posting.id,
      { ...parsed.data, track_responses: trackValidation.data },
      session?.user?.id ?? null,
    )

    if (!result.ok) {
      if (result.error === 'not_accepting') {
        return apiBadRequest('Bewerbungsfrist abgelaufen oder Stelle pausiert.')
      }
      return apiBadRequest('Bewerbung konnte nicht eingereicht werden.')
    }

    void notifyStaffNewApplication(
      result.application.id,
      result.application.applicant_name,
      posting.title,
      session?.user?.id,
    )
    void notifyApplicantConfirmation(email, parsed.data.applicant_name, posting.title)

    logger.info('Job application submitted', {
      applicationId: result.application.id,
      postingId: posting.id,
    })

    return apiSuccess({ id: result.application.id }, 201)
  } catch (error) {
    logger.error('Failed to submit job application', { error })
    return apiError(error, 'Bewerbung fehlgeschlagen')
  }
}
