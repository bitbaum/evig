/**
 * Admin HR vacancy by id
 * GET/PATCH/DELETE /api/admin/hr/vacancies/[id]
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { updateVacancySchema } from '@/lib/schemas/hr-vacancies'
import { getVacancyById, updateVacancy } from '@/lib/services/hr-vacancies'
import { db } from '@/db'
import { jobPostings } from '@/db/schema/hr-vacancies'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'

type Params = { id: string }

export const GET = withAdmin<{ id: string }>('team', async (_request, _session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')
    const posting = await getVacancyById(id)
    if (!posting) return apiNotFound('Stelle')
    return apiSuccess(posting)
  } catch (error) {
    logger.error('Failed to get HR vacancy', { error })
    return apiError(error, 'Stelle konnte nicht geladen werden')
  }
})

export const PATCH = withAdmin<{ id: string }>('team', async (request, _session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const parsed = updateVacancySchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0]?.message ?? 'Ungültige Angaben')
    }

    const posting = await updateVacancy(id, parsed.data)
    if (!posting) return apiNotFound('Stelle')
    return apiSuccess(posting)
  } catch (error) {
    logger.error('Failed to update HR vacancy', { error })
    return apiError(error, 'Stelle konnte nicht aktualisiert werden')
  }
})

export const DELETE = withAdmin<{ id: string }>('team', async (_request, _session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const [deleted] = await db.delete(jobPostings).where(eq(jobPostings.id, id)).returning({ id: jobPostings.id })
    if (!deleted) return apiNotFound('Stelle')
    return apiSuccess({ deleted: true })
  } catch (error) {
    logger.error('Failed to delete HR vacancy', { error })
    return apiError(error, 'Stelle konnte nicht gelöscht werden')
  }
})
