'use client'

import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { DropdownProvider } from '@/lib/contexts/DropdownContext'
import { SessionProvider } from '@/components/auth/SessionProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <DropdownProvider>
          {children}
        </DropdownProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
