/**
 * @deprecated Use GET /api/technicians/[id] instead.
 *
 * Legacy IT-Hilfe helper detail — kept for external callers.
 * `id` is repairer_profiles.id (profile UUID). Legacy userId lookups
 * are supported for one release via getTechnicianByIdOrUserId().
 */

import { NextRequest } from 'next/server'
import { apiError, apiSuccessCached, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'
import { getTechnicianByIdOrUserId, TECHNICIAN_UUID_RE } from '@/lib/services/technician-service'
import { toLegacyHelperProfile } from '@/lib/it-hilfe/legacy-helper-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!TECHNICIAN_UUID_RE.test(id)) {
      return apiBadRequest('Ungültige Helfer-ID')
    }

    const technician = await getTechnicianByIdOrUserId(id)

    if (!technician || technician.profileTier !== REPAIRER_PROFILE_TIER.COMMUNITY) {
      return apiNotFound('Helfer-Profil')
    }

    logger.info('Fetched legacy helper profile', { profileId: technician.id, lookupId: id })

    return apiSuccessCached({
      helper: toLegacyHelperProfile(technician),
    }, 60, 30)
  } catch (error) {
    logger.error('Error fetching helper profile', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
