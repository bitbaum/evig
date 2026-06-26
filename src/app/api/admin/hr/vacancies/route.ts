/**
 * Admin HR vacancies
 * GET /api/admin/hr/vacancies — list
 * POST /api/admin/hr/vacancies — create
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { createVacancySchema, vacancyFilterSchema } from '@/lib/schemas/hr-vacancies'
import { createVacancy, listVacanciesAdmin } from '@/lib/services/hr-vacancies'
import { VACANCY_STATUS_OPTIONS, type VacancyStatus, type RoleTrack } from '@/config/hr-vacancies'
import { logger } from '@/lib/logger'

export const GET = withAdmin('team', async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const filters = vacancyFilterSchema.safeParse({
      status: searchParams.get('status') || undefined,
      role_track: searchParams.get('role_track') || undefined,
      department: searchParams.get('department') || undefined,
      search: searchParams.get('search') || undefined,
    })
    if (!filters.success) return apiBadRequest('Ungültige Filter')

    const postings = await listVacanciesAdmin({
      status: filters.data.status as VacancyStatus | undefined,
      role_track: filters.data.role_track as RoleTrack | undefined,
      department: filters.data.department,
      search: filters.data.search,
    })

    return apiSuccess({ postings })
  } catch (error) {
    logger.error('Failed to list HR vacancies', { error })
    return apiError(error, 'Stellen konnten nicht geladen werden')
  }
})

export const POST = withAdmin('team', async (request, session) => {
  try {
    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error

    const body = await request.json()
    const parsed = createVacancySchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0]?.message ?? 'Ungültige Angaben')
    }

    const posting = await createVacancy(parsed.data, userLookup.dbUserId)
    logger.info('HR vacancy created', { postingId: posting.id, userId: userLookup.dbUserId })
    return apiSuccess(posting, 201)
  } catch (error) {
    logger.error('Failed to create HR vacancy', { error })
    return apiError(error, 'Stelle konnte nicht erstellt werden')
  }
})
