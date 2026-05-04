'use client'

import { ReactNode, useEffect, useState } from 'react'
import { SessionContext } from 'next-auth/react'

// SessionContext from next-auth/react (default value is undefined — useSession throws when no Provider)
// We provide a "loading" fallback here so components calling useSession render safely during SSR.
// The real SessionProvider is lazy-loaded client-side to avoid circular deps during SSG.

type NextAuthSessionProvider = React.ComponentType<{
  children: ReactNode
  refetchInterval?: number
  refetchOnWindowFocus?: boolean
  refetchWhenOffline?: boolean
  basePath?: string
}>

interface Props {
  children: ReactNode
}

const SSR_SESSION_FALLBACK = { data: null, status: 'loading' as const, update: async () => null }

let _cachedSP: NextAuthSessionProvider | null = null

function LazyAuthProvider({ children }: Props) {
  const [SP, setSP] = useState<NextAuthSessionProvider | null>(_cachedSP)

  useEffect(() => {
    if (_cachedSP) return
    import('next-auth/react').then(({ SessionProvider: sp }) => {
      _cachedSP = sp as NextAuthSessionProvider
      setSP(_cachedSP)
    })
  }, [])

  if (!SP) return <>{children}</>

  return (
    <SP
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      basePath="/api/auth"
    >
      {children}
    </SP>
  )
}

export function SessionProvider({ children }: Props) {
  if (typeof window === 'undefined') {
    // During SSR: provide a loading-state context so useSession returns
    // { data: null, status: 'loading' } instead of throwing.
    return (
      <SessionContext.Provider value={SSR_SESSION_FALLBACK}>
        {children}
      </SessionContext.Provider>
    )
  }
  return <LazyAuthProvider>{children}</LazyAuthProvider>
}
