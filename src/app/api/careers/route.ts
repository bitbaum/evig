/**
 * Public careers list
 * GET /api/careers
 */

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { listPublicVacancies } from '@/lib/services/hr-vacancies'
import { ROLE_TRACK_OPTIONS, type RoleTrack } from '@/config/hr-vacancies'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const roleTrack = searchParams.get('track')
    const department = searchParams.get('department') ?? undefined

    const postings = await listPublicVacancies({
      role_track:
        roleTrack && ROLE_TRACK_OPTIONS.includes(roleTrack as RoleTrack)
          ? (roleTrack as RoleTrack)
          : undefined,
      department,
    })

    return apiSuccess({ postings })
  } catch (error) {
    logger.error('Failed to list public careers', { error })
    return apiError(error, 'Stellen konnten nicht geladen werden')
  }
}
