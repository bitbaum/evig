/**
 * GET /api/profiles/[id] — Unified public profile.
 *
 * One person, everything they publicly offer: marketplace listings, technician
 * services, workshops, authored content, plus their two-sided reputation.
 * Backs the public profile page rendered at both /members/[id] and /sellers/[id].
 */

import { NextRequest } from 'next/server'
import { apiSuccessCached, apiError, apiNotFound } from '@/lib/api/helpers'
import { getPublicProfile } from '@/lib/services/profile-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!id) return apiNotFound('Profil')

    const profile = await getPublicProfile(id)
    if (!profile) return apiNotFound('Profil')

    // Public + semi-static → cache 60s, stale 30s.
    return apiSuccessCached({ profile }, 60, 30)
  } catch (error) {
    return apiError(error, 'Fehler beim Laden des Profils')
  }
}
