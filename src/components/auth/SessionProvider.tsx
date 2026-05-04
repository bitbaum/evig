'use client'

import { ReactNode, useEffect, useState } from 'react'
import { SessionContext } from 'next-auth/react'

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

// Stable fallback so SSR and first client render produce identical output.
// useSession() returns {data:null, status:'loading'} until the real SP mounts.
const SSR_SESSION_FALLBACK = { data: null, status: 'loading' as const, update: async () => null }

let _cachedSP: NextAuthSessionProvider | null = null

// Lazy-loads next-auth/react client-side to avoid the React-null circular-dependency
// that can occur in Next.js 16 + next-auth v5 beta SSR bundles during static generation.
// Before the import resolves (and on the server), children are wrapped in a
// SessionContext.Provider with a loading-state fallback so useSession() never throws.
function LazyAuthProvider({ children }: Props) {
  // Wrap in arrow fn — React calls function args to useState/setState as initializers/updaters.
  // Passing the component directly would invoke SessionProvider() with no args → crash.
  const [SP, setSP] = useState<NextAuthSessionProvider | null>(() => _cachedSP)

  useEffect(() => {
    if (_cachedSP) return
    import('next-auth/react').then(({ SessionProvider: sp }) => {
      _cachedSP = sp as NextAuthSessionProvider
      setSP(() => sp as NextAuthSessionProvider)
    })
  }, [])

  if (!SP) {
    return (
      <SessionContext.Provider value={SSR_SESSION_FALLBACK}>
        {children}
      </SessionContext.Provider>
    )
  }

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
  return <LazyAuthProvider>{children}</LazyAuthProvider>
}
