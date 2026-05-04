'use client'

import { ReactNode, useEffect, useState } from 'react'

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

let _cachedSP: NextAuthSessionProvider | null = null

// Loaded only on the client — keeps next-auth/react out of the server-side SSR
// bundle and avoids the React-null circular-dependency in certain Next.js 16 +
// next-auth v5 beta SSR bundles during static generation.
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
    return <>{children}</>
  }
  return <LazyAuthProvider>{children}</LazyAuthProvider>
}
