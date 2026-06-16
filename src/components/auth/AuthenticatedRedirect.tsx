'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { sanitizeReturnTo } from '@/lib/utils/safe-redirect'

interface AuthenticatedRedirectProps {
  /** Where non-staff users land when no callbackUrl is present. */
  defaultHref?: string
}

/**
 * Sends already-authenticated visitors away from login/register.
 * Respects callbackUrl so checkout and other deep links recover correctly.
 */
export function AuthenticatedRedirect({
  defaultHref = '/dashboard',
}: AuthenticatedRedirectProps) {
  const { status, data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = sanitizeReturnTo(searchParams.get('callbackUrl'), '')

  useEffect(() => {
    if (status !== 'authenticated') return

    if (callbackUrl) {
      router.replace(callbackUrl)
      return
    }

    router.replace(session?.user?.isStaff ? '/admin' : defaultHref)
  }, [status, session, callbackUrl, defaultHref, router])

  return null
}
