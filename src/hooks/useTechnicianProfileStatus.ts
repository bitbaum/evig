'use client'

import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api/client'
import {
  getTechnicianProfileGaps,
  isTechnicianProfileMatchReady,
  type TechnicianProfileGap,
} from '@/lib/domain/technician-profile'
import type { TechnicianProfile } from '@/hooks/useTechnicianProfile'

interface TechnicianProfileResponse {
  profile: TechnicianProfile | null
  hasProfile: boolean
}

export function useTechnicianProfileStatus() {
  const { data: session, status: authStatus } = useSession()

  const { data, isLoading } = useSWR(
    session?.user ? '/api/user/technician-profile' : null,
    (url: string) => apiFetch<TechnicianProfileResponse>(url),
  )

  const profile = data?.success ? data.data?.profile ?? null : null
  const hasProfile = Boolean(data?.success && data.data?.hasProfile)
  // "Is a technician" for nav/menus = an ACTIVE profile, matching the offer
  // boundary (getActiveTechnicianProfileId). A paused profile shouldn't surface
  // the helper menu items (they'd 403 on offering) — SSOT-align both.
  const isActiveTechnician = hasProfile && profile?.isActive === true
  const gaps: TechnicianProfileGap[] = profile ? getTechnicianProfileGaps(profile) : []
  const isMatchReady = profile ? isTechnicianProfileMatchReady(profile) : false

  return {
    profile,
    gaps,
    isMatchReady,
    hasProfile,
    isActiveTechnician,
    loading: authStatus === 'loading' || (session?.user && isLoading),
    isAuthenticated: authStatus === 'authenticated',
  }
}
