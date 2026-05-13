'use client'

import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { CsrfFetchProvider } from '@/components/providers/CsrfFetchProvider'
import { DropdownProvider } from '@/lib/contexts/DropdownContext'
import { SessionProvider } from '@/components/auth/SessionProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
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
