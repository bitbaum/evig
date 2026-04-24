/**
 * Unified Technician Detail API
 * GET /api/technicians/[id] - Get a single technician profile with skills and services
 *
 * Works for both community (formerly helper_profiles) and professional
 * (formerly repairer_profiles) technicians — both now live in repairer_profiles.
 */

import { NextRequest } from 'next/server'
import { apiError, apiSuccessCached, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { getTechnicianById } from '@/lib/services/technician-service'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/technicians/[id]
 * Returns the full profile for a single technician.
 * Auth: public.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!UUID_RE.test(id)) {
      return apiBadRequest('Ungültige Techniker-ID')
    }

    const technician = await getTechnicianById(id)

    if (!technician) {
      return apiNotFound('Techniker-Profil')
    }

    logger.info('Served technician profile via API', { technicianId: id })

    // Individual technician profiles are semi-static public data — cache 60s, stale 30s
    return apiSuccessCached({ technician }, 60, 30)
  } catch (error) {
    logger.error('Error fetching technician profile', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
