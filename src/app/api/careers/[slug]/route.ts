/**
 * Public career posting detail
 * GET /api/careers/[slug]
 */

import { NextRequest } from 'next/server'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers'
import { getVacancyBySlug } from '@/lib/services/hr-vacancies'
import { PUBLIC_VACANCY_STATUSES } from '@/config/hr-vacancies'
import { logger } from '@/lib/logger'

type Params = { slug: string }

export async function GET(
  _request: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const { slug } = await context.params
    const posting = await getVacancyBySlug(slug)
    if (!posting || !PUBLIC_VACANCY_STATUSES.includes(posting.status as typeof PUBLIC_VACANCY_STATUSES[number])) {
      return apiNotFound('Stelle')
    }
    return apiSuccess(posting)
  } catch (error) {
    logger.error('Failed to get career posting', { error })
    return apiError(error, 'Stelle konnte nicht geladen werden')
  }
}
