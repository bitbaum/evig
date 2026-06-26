/**
 * POST /api/admin/hr/vacancies/[id]/transition
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { transitionVacancySchema } from '@/lib/schemas/hr-vacancies'
import { transitionVacancy } from '@/lib/services/hr-vacancies'
import { VACANCY_STATUS_LABELS, type VacancyStatus } from '@/config/hr-vacancies'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

export const POST = withAdmin<{ id: string }>('team', async (request, _session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const parsed = transitionVacancySchema.safeParse(body)
    if (!parsed.success) return apiBadRequest(parsed.error.issues[0]?.message ?? 'Ungültig')

    const result = await transitionVacancy(id, parsed.data.status as VacancyStatus)
    if (!result.ok) {
      if (result.error === 'not_found') return apiNotFound('Stelle')
      if (result.error === 'invalid_transition') {
        return apiBadRequest(ERROR_MESSAGES.INVALID_STATUS_TRANSITION ?? 'Ungültiger Statuswechsel')
      }
      return apiBadRequest('Statuswechsel fehlgeschlagen')
    }

    logger.info('HR vacancy transitioned', {
      vacancyId: id,
      status: parsed.data.status,
      label: VACANCY_STATUS_LABELS[parsed.data.status as VacancyStatus],
    })

    return apiSuccess(result.vacancy)
  } catch (error) {
    logger.error('Failed to transition HR vacancy', { error })
    return apiError(error, 'Statuswechsel fehlgeschlagen')
  }
})
