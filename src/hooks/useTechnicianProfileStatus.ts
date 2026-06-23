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
  const gaps: TechnicianProfileGap[] = profile ? getTechnicianProfileGaps(profile) : []
  const isMatchReady = profile ? isTechnicianProfileMatchReady(profile) : false

  return {
    profile,
    gaps,
    isMatchReady,
    hasProfile,
    loading: authStatus === 'loading' || (session?.user && isLoading),
    isAuthenticated: authStatus === 'authenticated',
  }
}
