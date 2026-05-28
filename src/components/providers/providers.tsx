'use client'

import type { Session } from 'next-auth'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { CsrfFetchProvider } from '@/components/providers/CsrfFetchProvider'
import { DropdownProvider } from '@/lib/contexts/DropdownContext'
import { SessionProvider } from '@/components/auth/SessionProvider'

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode
  session?: Session | null
}) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <DropdownProvider>
          <CsrfFetchProvider />
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </DropdownProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
