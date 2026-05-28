'use client'

import { ReactNode, useEffect, useState } from 'react'
import { SessionContext } from 'next-auth/react'
import type { Session } from 'next-auth'

type NextAuthSessionProvider = React.ComponentType<{
  children: ReactNode
  session?: Session | null
  refetchInterval?: number
  refetchOnWindowFocus?: boolean
  refetchWhenOffline?: boolean
  basePath?: string
}>

interface Props {
  children: ReactNode
  /** Session pre-fetched server-side in the root layout. */
  session?: Session | null
}

let _cachedSP: NextAuthSessionProvider | null = null

// Lazy-loads next-auth/react client-side to avoid the React-null circular-dependency
// that can occur in Next.js 16 + next-auth v5 beta SSR bundles during static generation.
//
// When the parent layout passes `session` (fetched via auth() server-side),
// the fallback context starts in the correct authenticated/unauthenticated
// state instead of 'loading'. This is what stops the Anmelden/Registrieren
// flash (or stuck state) for logged-in users — previously useSession()
// returned 'loading' on first render, the navbar showed login buttons, and
// if the lazy SP import or its re-render didn't land cleanly (hydration
// error, slow chunk fetch, etc.) the buttons stayed visible.
function LazyAuthProvider({ children, session }: Props) {
  const [SP, setSP] = useState<NextAuthSessionProvider | null>(() => _cachedSP)

  // Build a fallback that matches the server-known auth state. `loading`
  // is only used when we have no server session AND the real SP hasn't
  // mounted yet — never for an already-authenticated user.
  const fallback = session?.user
    ? { data: session, status: 'authenticated' as const, update: async () => session }
    : session === null
      ? { data: null, status: 'unauthenticated' as const, update: async () => null }
      : { data: null, status: 'loading' as const, update: async () => null }

  useEffect(() => {
    if (_cachedSP) return
    import('next-auth/react').then(({ SessionProvider: sp }) => {
      _cachedSP = sp as NextAuthSessionProvider
      setSP(() => sp as NextAuthSessionProvider)
    })
  }, [])

  if (!SP) {
    return (
      <SessionContext.Provider value={fallback}>
        {children}
      </SessionContext.Provider>
    )
  }

  return (
    <SP
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      basePath="/api/auth"
    >
      {children}
    </SP>
  )
}

export function SessionProvider({ children, session }: Props) {
  return <LazyAuthProvider session={session}>{children}</LazyAuthProvider>
}
