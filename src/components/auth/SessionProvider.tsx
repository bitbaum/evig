'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function SessionProvider({ children }: Props) {
  return (
    <NextAuthSessionProvider
      // Optimize session fetching to not block page loads
      // These settings ensure session checks don't delay UI rendering
      refetchInterval={0} // Don't auto-refetch
      refetchOnWindowFocus={false} // Don't refetch on window focus
      refetchWhenOffline={false} // Don't refetch when offline
      // Base path for auth API - ensures proper routing
      basePath="/api/auth"
    >
      {children}
    </NextAuthSessionProvider>
  )
}








